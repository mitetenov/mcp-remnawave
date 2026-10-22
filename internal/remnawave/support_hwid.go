package remnawave

import (
	"errors"
	"regexp"
)

// These support-only operations retain the Telegram ownership checks added in
// upstream b60d24d. Full-mode tools continue to use their original panel routes.
type supportAccount struct {
	id       float64
	username any
}

func responseRecord(value any) (any, error) {
	response := get(value, "response")
	switch response.(type) {
	case map[string]any, []any:
		return response, nil
	default:
		return nil, errors.New("Remnawave API returned an invalid response") //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
	}
}

func extractSupportUsers(value any) ([]supportAccount, error) {
	response, err := responseRecord(value)
	if err != nil {
		return nil, err
	}
	users, ok := get(response, "users").([]any)
	if !ok {
		return nil, errors.New("Remnawave API returned an invalid users response") //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
	}
	accounts := make([]supportAccount, 0, len(users))
	for _, user := range users {
		id, ok := get(user, "id").(float64)
		if !ok {
			continue
		}
		username := get(user, "username")
		if _, ok := username.(string); !ok {
			username = undef
		}
		accounts = append(accounts, supportAccount{id: id, username: username})
	}
	return accounts, nil
}

func extractSupportDevices(value any) ([]any, error) {
	response, err := responseRecord(value)
	if err != nil {
		return nil, err
	}
	devices, ok := get(response, "devices").([]any)
	if !ok {
		return nil, errors.New("Remnawave API returned an invalid HWID response") //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
	}
	valid := make([]any, 0, len(devices))
	for _, device := range devices {
		if _, ok := get(device, "hwid").(string); ok {
			valid = append(valid, device)
		}
	}
	return valid, nil
}

func (e *executor) supportAccounts(telegramID any) []supportAccount {
	value := e.getUsersByTelegramId(telegramID, 100)
	if e.err != nil {
		return nil
	}
	accounts, err := extractSupportUsers(value)
	if err != nil {
		e.err = err
	}
	return accounts
}

func (e *executor) getSupportHwidDevicesByTelegramID(telegramID any) any {
	users := e.supportAccounts(telegramID)
	if e.err != nil {
		return nil
	}
	type accountResult struct {
		index   int
		account object
		count   int
		err     error
	}
	// Each request has its own error state. The buffered channel lets outstanding
	// requests finish even when one account fails, matching Promise.all's behavior.
	completed := make(chan accountResult, len(users))
	for i, user := range users {
		go func() {
			child := &executor{ctx: e.ctx, config: e.config}
			value := child.getUserHwidDevices(user.id)
			var devices []any
			if child.err == nil {
				devices, child.err = extractSupportDevices(value)
			}
			completed <- accountResult{index: i, account: merge(object{"userId": user.id, "username": user.username, "devices": devices}), count: len(devices), err: child.err}
		}()
	}
	accounts := make([]any, len(users))
	total := 0
	for range users {
		result := <-completed
		if result.err != nil {
			e.err = result.err
			return nil
		}
		accounts[result.index] = result.account
		total += result.count
	}
	return object{"response": object{"total": total, "accounts": accounts}}
}

var hwidDeviceNotFound = regexp.MustCompile(`(?i)hwid\s+device\s+not\s+found`)

func hasHwidDevice(devices []any, hwid any) bool {
	for _, device := range devices {
		if equal(get(device, "hwid"), hwid) {
			return true
		}
	}
	return false
}

func (e *executor) supportDevices(userID any) []any {
	value := e.getUserHwidDevices(userID)
	if e.err != nil {
		return nil
	}
	devices, err := extractSupportDevices(value)
	if err != nil {
		e.err = err
	}
	return devices
}

func (e *executor) deleteSupportHwidDeviceByTelegramID(telegramID, userID, hwid any) any {
	accounts := e.supportAccounts(telegramID)
	if e.err != nil {
		return nil
	}
	owned := false
	for _, account := range accounts {
		if equal(account.id, userID) {
			owned = true
			break
		}
	}
	absent := object{"status": "already_absent", "userId": userID, "hwid": hwid}
	if !owned {
		return merge(absent, object{"reason": "account_not_owned_by_telegram_id"})
	}
	devices := e.supportDevices(userID)
	if e.err != nil {
		return nil
	}
	if !hasHwidDevice(devices, hwid) {
		return absent
	}
	result := e.deleteHwidDevice(object{"userId": userID, "hwid": hwid})
	if e.err == nil {
		return object{"status": "deleted", "userId": userID, "hwid": hwid, "result": result}
	}
	if !hwidDeviceNotFound.MatchString(e.err.Error()) {
		return nil
	}
	// A matching panel error is idempotent success only after another current
	// device read confirms absence. Preserve unrelated failures and failed reads.
	deleteErr := e.err
	e.err = nil
	fresh := e.supportDevices(userID)
	if e.err != nil {
		return nil
	}
	if !hasHwidDevice(fresh, hwid) {
		return absent
	}
	e.err = deleteErr
	return nil
}
