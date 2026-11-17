package remnawave

import (
	"encoding/json"
	"errors"
	"math"
	"net/url"
	"strconv"
	"time"
)

const (
	torrentBlockerReportsPath = "/api/node-plugins/torrent-blocker"
	torrentBlockerPageSize    = 100
	recentTorrentBlockWindow  = 15 * time.Minute
)

type torrentBlock struct {
	blockedAt       time.Time
	unblocksAt      time.Time
	durationSeconds float64
}

type torrentBlockAccount struct {
	id       int64
	username string
}

func (e *executor) getTorrentBlockByTelegramID(value any) any {
	telegramID, ok := torrentBlockerID(value)
	if !ok {
		e.err = errors.New("telegramId must be a positive safe integer")
		return nil
	}
	accounts := e.torrentBlockAccounts(telegramID)
	if e.err != nil {
		return nil
	}
	var latest torrentBlock
	for _, account := range accounts {
		block := e.latestTorrentBlock(account)
		if e.err != nil {
			return nil
		}
		if block.unblocksAt.After(latest.unblocksAt) {
			latest = block
		}
	}
	now := clockNow()
	if latest.unblocksAt.IsZero() || !latest.unblocksAt.Add(recentTorrentBlockWindow).After(now) {
		return object{"status": "not_found"}
	}
	status := "recent"
	if latest.unblocksAt.After(now) {
		status = "active"
	}
	return object{
		"status":          status,
		"blockedAt":       latest.blockedAt.UTC(),
		"unblocksAt":      latest.unblocksAt.UTC(),
		"durationSeconds": latest.durationSeconds,
	}
}

func torrentBlockerID(value any) (int64, bool) {
	id, err := strconv.ParseInt(str(value), 10, 64)
	return id, err == nil && id > 0 && id < 1<<53
}

func (e *executor) torrentBlockAccounts(telegramID int64) []torrentBlockAccount {
	var accounts []torrentBlockAccount
	var cursor int64
	for {
		value := e.getUsersByTelegramId(telegramID, torrentBlockerPageSize, cursor)
		if e.err != nil {
			return nil
		}
		response := get(value, "response")
		users, usersOK := get(response, "users").([]any)
		hasMore, hasMoreOK := get(response, "hasMore").(bool)
		if !usersOK || !hasMoreOK {
			e.err = errors.New("invalid user lookup response from Remnawave")
			return nil
		}
		for _, user := range users {
			ownerID, ok := torrentBlockerID(get(user, "telegramId"))
			if !ok || ownerID != telegramID {
				continue
			}
			id, idOK := torrentBlockerID(get(user, "id"))
			username, nameOK := get(user, "username").(string)
			if !idOK || !nameOK || username == "" {
				e.err = errors.New("invalid account in Remnawave user lookup")
				return nil
			}
			accounts = append(accounts, torrentBlockAccount{id: id, username: username})
		}
		if !hasMore {
			return accounts
		}
		nextCursor, ok := torrentBlockerID(get(response, "nextCursor"))
		if !ok || nextCursor <= cursor {
			e.err = errors.New("invalid cursor in Remnawave user lookup")
			return nil
		}
		cursor = nextCursor
	}
}

func (e *executor) latestTorrentBlock(account torrentBlockAccount) torrentBlock {
	var latest torrentBlock
	// Remnawave 3.4.2 matches numeric filter values by substring. An exact
	// username filter keeps the number of reports returned per account small.
	filters, _ := json.Marshal([]object{{"id": "user.username", "value": account.username}})
	query := url.Values{
		"size":        {strconv.Itoa(torrentBlockerPageSize)},
		"filters":     {string(filters)},
		"filterModes": {`{"user.username":"equals"}`},
	}
	for start := 0; ; {
		query.Set("start", strconv.Itoa(start))
		value := e.request("GET", torrentBlockerReportsPath+"?"+query.Encode())
		if e.err != nil {
			return torrentBlock{}
		}
		response := get(value, "response")
		records, recordsOK := get(response, "records").([]any)
		total, totalOK := get(response, "total").(float64)
		if !recordsOK || !totalOK || total < 0 || total != math.Trunc(total) {
			e.err = errors.New("invalid Torrent Blocker reports response from Remnawave")
			return torrentBlock{}
		}
		for _, record := range records {
			if reportID, ok := torrentBlockerID(get(record, "userId")); !ok || reportID != account.id {
				continue
			}
			block, err := parseTorrentBlock(record)
			if err != nil {
				e.err = err
				return torrentBlock{}
			}
			if block.unblocksAt.After(latest.unblocksAt) {
				latest = block
			}
		}
		start += len(records)
		if len(records) == 0 || float64(start) >= total {
			return latest
		}
	}
}

func parseTorrentBlock(record any) (torrentBlock, error) {
	action := get(get(record, "report"), "actionReport")
	blocked, ok := get(action, "blocked").(bool)
	if !ok {
		return torrentBlock{}, errors.New("invalid Torrent Blocker action report from Remnawave")
	}
	if !blocked {
		return torrentBlock{}, nil
	}
	blockedAt, blockedAtErr := time.Parse(time.RFC3339Nano, str(get(action, "processedAt")))
	unblocksAt, unblocksAtErr := time.Parse(time.RFC3339Nano, str(get(action, "willUnblockAt")))
	duration, _ := get(action, "blockDuration").(float64)
	if blockedAtErr != nil || unblocksAtErr != nil || !unblocksAt.After(blockedAt) || duration <= 0 {
		return torrentBlock{}, errors.New("invalid Torrent Blocker block timing from Remnawave")
	}
	return torrentBlock{blockedAt: blockedAt, unblocksAt: unblocksAt, durationSeconds: duration}, nil
}
