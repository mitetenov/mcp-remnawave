package remnawave

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"testing"
	"time"
)

type torrentBlockerTestTransport func(*http.Request) (*http.Response, error)

func (f torrentBlockerTestTransport) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

func TestTorrentBlockByTelegramID(t *testing.T) {
	now := time.Date(2026, 11, 17, 12, 0, 0, 0, time.UTC)
	clockNow = func() time.Time { return now }
	t.Cleanup(func() { clockNow = time.Now })

	type step struct {
		path   string
		status int
		body   any
	}
	users := func(cursor string, nextCursor any, accounts ...object) step {
		path := "/api/users/stream?telegramId=42&size=100"
		if cursor != "" {
			path += "&cursor=" + cursor
		}
		return step{path: path, body: object{"response": object{"users": append([]object{}, accounts...), "hasMore": nextCursor != nil, "nextCursor": nextCursor}}}
	}
	page := func(userID, start, total int, reports ...object) step {
		query := url.Values{
			"start":       {strconv.Itoa(start)},
			"size":        {"100"},
			"filters":     {fmt.Sprintf(`[{"id":"user.username","value":"account%d"}]`, userID)},
			"filterModes": {`{"user.username":"equals"}`},
		}
		return step{path: "/api/node-plugins/torrent-blocker?" + query.Encode(), body: object{"response": object{"records": append([]object{}, reports...), "total": total}}}
	}
	report := func(userID int, blocked bool, unblocksAt time.Time) object {
		return object{"userId": userID, "report": object{"actionReport": object{
			"blocked":       blocked,
			"willUnblockAt": unblocksAt,
			"processedAt":   unblocksAt.Add(-2 * time.Minute),
			"blockDuration": 120,
			"ip":            "192.0.2.1",
		}}}
	}
	result := func(status string, unblocksAt time.Time) object {
		return object{"status": status, "blockedAt": unblocksAt.Add(-2 * time.Minute), "unblocksAt": unblocksAt, "durationSeconds": 120}
	}
	owner := object{"id": 17, "telegramId": 42, "username": "account17"}
	lookup := users("", nil, owner)
	activeUntil := now.Add(time.Minute)
	foreignBlock := report(117, true, now.Add(2*time.Hour))
	forbidden := page(17, 0, 0)
	forbidden.status = http.StatusForbidden
	forbidden.body = object{"message": "missing scope"}

	for _, tc := range []struct {
		name    string
		steps   []step
		want    object
		wantErr string
	}{
		{
			name: "active across accounts and report pages",
			steps: []step{
				users("", "17", owner),
				users("17", nil, object{"id": 23, "telegramId": 42, "username": "account23"}, object{"id": 117, "telegramId": 99}),
				page(17, 0, 2, foreignBlock),
				page(17, 1, 2, report(17, true, now.Add(-time.Minute))),
				page(23, 0, 1, report(23, true, activeUntil)),
			},
			want: result("active", activeUntil),
		},
		{
			name:  "recent once expiry is reached",
			steps: []step{lookup, page(17, 0, 1, report(17, true, now))},
			want:  result("recent", now),
		},
		{
			name: "old, ignored and foreign reports do not count",
			steps: []step{lookup, page(17, 0, 3, foreignBlock,
				report(17, true, now.Add(-15*time.Minute)), report(17, false, activeUntil))},
			want: object{"status": "not_found"},
		},
		{
			name:  "no linked account",
			steps: []step{users("", nil)},
			want:  object{"status": "not_found"},
		},
		{
			name:  "empty report list",
			steps: []step{lookup, page(17, 0, 0)},
			want:  object{"status": "not_found"},
		},
		{
			name:    "malformed report fails the check",
			steps:   []step{lookup, page(17, 0, 1, object{"userId": 17})},
			wantErr: "invalid Torrent Blocker action report",
		},
		{
			name:    "report endpoint failure",
			steps:   []step{lookup, forbidden},
			wantErr: "missing scope",
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			index := 0
			client := &http.Client{Transport: torrentBlockerTestTransport(func(r *http.Request) (*http.Response, error) {
				if index >= len(tc.steps) {
					t.Fatalf("unexpected request %s %s", r.Method, r.URL)
				}
				step := tc.steps[index]
				index++
				if r.Method != http.MethodGet || r.URL.RequestURI() != step.path {
					t.Fatalf("request %s %s, want GET %s", r.Method, r.URL, step.path)
				}
				status := step.status
				if status == 0 {
					status = http.StatusOK
				}
				body, err := json.Marshal(step.body)
				if err != nil {
					t.Fatal(err)
				}
				return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(string(body)))}, nil
			})}
			e := &executor{ctx: context.Background(), config: Config{Support: true, BaseURL: "https://panel.example", APIToken: "token", HTTPClient: client}}
			out := runTool(e, "users_get_torrent_block_by_telegram_id", object{"telegramId": float64(42)})
			if index != len(tc.steps) {
				t.Fatalf("made %d requests, want %d", index, len(tc.steps))
			}
			if tc.wantErr != "" {
				if e.err == nil || !strings.Contains(e.err.Error(), tc.wantErr) {
					t.Fatalf("got result %v and error %v, want %q", out, e.err, tc.wantErr)
				}
				return
			}
			got, _ := json.Marshal(out)
			want, _ := json.Marshal(tc.want)
			if e.err != nil || string(got) != string(want) {
				t.Fatalf("got %s, error %v, want %s", got, e.err, want)
			}
		})
	}
}
