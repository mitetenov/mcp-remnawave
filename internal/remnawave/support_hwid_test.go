package remnawave

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"sync"
	"testing"
	"time"
)

func TestSupportHwidDeletionOwnershipAndRaces(t *testing.T) {
	type step struct {
		method, path string
		body         any
		status       int
		payload      any
	}
	userID, telegramID := float64(7), float64(123)
	users := object{"response": object{"users": []any{object{"id": userID}}}}
	present := object{"response": object{"devices": []any{object{"hwid": "current"}}}}
	absent := object{"response": object{"devices": []any{}}}
	lookup := step{method: "GET", path: "/api/users/stream?telegramId=123&size=100", payload: users}
	readPresent := step{method: "GET", path: "/api/hwid/devices/7", payload: present}
	readAbsent := step{method: "GET", path: "/api/hwid/devices/7", payload: absent}
	remove := step{method: "POST", path: "/api/hwid/devices/delete", body: object{"userId": userID, "hwid": "current"}, payload: object{"response": object{"success": true}}}
	notFound := remove
	notFound.status = 404
	notFound.payload = object{"message": "HWID device not found"}
	cases := []struct {
		name    string
		steps   []step
		want    any
		wantErr string
	}{
		{name: "unowned account never reads or deletes its devices", steps: []step{{method: lookup.method, path: lookup.path, payload: object{"response": object{"users": []any{object{"id": float64(8)}}}}}}, want: object{"status": "already_absent", "userId": userID, "hwid": "current", "reason": "account_not_owned_by_telegram_id"}},
		{name: "stale device never sends delete", steps: []step{lookup, readAbsent}, want: object{"status": "already_absent", "userId": userID, "hwid": "current"}},
		{name: "current owned device is deleted", steps: []step{lookup, readPresent, remove}, want: object{"status": "deleted", "userId": userID, "hwid": "current", "result": remove.payload}},
		{name: "concurrent removal requires a fresh absent read", steps: []step{lookup, readPresent, notFound, readAbsent}, want: object{"status": "already_absent", "userId": userID, "hwid": "current"}},
		{name: "not found message with a still present device remains an error", steps: []step{lookup, readPresent, notFound, readPresent}, wantErr: "Remnawave API error: HWID device not found"},
		{name: "unrelated API failure is not swallowed or reread", steps: []step{lookup, readPresent, {method: remove.method, path: remove.path, body: remove.body, status: 403, payload: object{"message": "backend denied"}}}, wantErr: "Remnawave API error: backend denied"},
		{name: "failed verification read surfaces its own error", steps: []step{lookup, readPresent, notFound, {method: readPresent.method, path: readPresent.path, status: 502, payload: object{"message": "read failed"}}}, wantErr: "Remnawave API error: read failed"},
		{name: "invalid users envelope is not treated as an empty owner list", steps: []step{{method: lookup.method, path: lookup.path, payload: object{"users": []any{object{"id": userID}}}}}, wantErr: "Remnawave API returned an invalid response"},
		{name: "invalid users collection is rejected", steps: []step{{method: lookup.method, path: lookup.path, payload: object{"response": object{"users": nil}}}}, wantErr: "Remnawave API returned an invalid users response"},
		{name: "invalid device collection is rejected without deletion", steps: []step{lookup, {method: readPresent.method, path: readPresent.path, payload: object{"response": object{"devices": nil}}}}, wantErr: "Remnawave API returned an invalid HWID response"},
		{name: "error matching follows the upstream message regex rather than status", steps: []step{lookup, readPresent, {method: remove.method, path: remove.path, body: remove.body, status: 409, payload: object{"message": "HWID  Device\nNot Found"}}, readAbsent}, want: object{"status": "already_absent", "userId": userID, "hwid": "current"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			index := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if index >= len(tc.steps) {
					t.Errorf("unexpected upstream request %s %s", r.Method, r.URL)
					w.WriteHeader(500)
					return
				}
				want := tc.steps[index]
				index++
				b, _ := io.ReadAll(r.Body)
				var body any
				if len(b) != 0 {
					_ = json.Unmarshal(b, &body)
				}
				if r.Method != want.method || r.URL.RequestURI() != want.path || !reflect.DeepEqual(body, want.body) {
					t.Errorf("upstream request %s %s %s does not match %#v", r.Method, r.URL, b, want)
				}
				if r.Header.Get("Authorization") != "Bearer test-token" {
					t.Error("missing scoped API token")
				}
				w.Header().Set("Content-Type", "application/json")
				if want.status != 0 {
					w.WriteHeader(want.status)
				}
				_ = json.NewEncoder(w).Encode(want.payload)
			}))
			defer server.Close()
			e := &executor{ctx: context.Background(), config: Config{BaseURL: server.URL, APIToken: "test-token", Support: true}}
			out := runTool(e, "hwid_device_delete", object{"telegramId": telegramID, "userId": userID, "hwid": "current"})
			if tc.wantErr != "" {
				if e.err == nil || e.err.Error() != tc.wantErr {
					t.Fatalf("error = %v, want %s", e.err, tc.wantErr)
				}
			} else {
				got, _ := json.Marshal(out)
				want, _ := json.Marshal(tc.want)
				if e.err != nil || string(got) != string(want) {
					t.Fatalf("result %s / %v, want %s", got, e.err, want)
				}
			}
			if index != len(tc.steps) {
				t.Fatalf("only %d of %d expected upstream requests", index, len(tc.steps))
			}
		})
	}
}

func TestSupportHwidSnapshotAcrossAccounts(t *testing.T) {
	arrived := make(chan string, 2)
	release := make(chan struct{})
	var mu sync.Mutex
	requests := []string{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		requests = append(requests, r.URL.RequestURI())
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/api/users/stream" {
			_ = json.NewEncoder(w).Encode(object{"response": object{"users": []any{nil, object{"id": "skip"}, object{"id": 7, "username": "first"}, object{"id": 8, "username": 42}}}})
			return
		}
		arrived <- r.URL.Path
		<-release
		_ = json.NewEncoder(w).Encode(object{"response": object{"devices": []any{nil, object{"hwid": 42}, object{"hwid": r.URL.Path, "platform": "example", "trojanPassword": "redact", "nested": object{"address": "redact", "keep": true}}}}})
	}))
	defer server.Close()
	e := &executor{ctx: context.Background(), config: Config{BaseURL: server.URL, APIToken: "test-token", Support: true, Timeout: time.Second}}
	result := make(chan any, 1)
	go func() { result <- runTool(e, "hwid_devices_list", object{"telegramId": float64(123)}) }()
	for range 2 {
		select {
		case <-arrived:
		case <-time.After(time.Second):
			close(release)
			t.Fatal("account device reads must run concurrently")
		}
	}
	close(release)
	out := <-result
	if e.err != nil {
		t.Fatal(e.err)
	}
	expected := object{"response": object{"total": 2, "accounts": []any{
		object{"userId": 7, "username": "first", "devices": []any{object{"hwid": "/api/hwid/devices/7", "platform": "example", "nested": object{"keep": true}}}},
		object{"userId": 8, "devices": []any{object{"hwid": "/api/hwid/devices/8", "platform": "example", "nested": object{"keep": true}}}},
	}}}
	got, _ := json.Marshal(out)
	want, _ := json.Marshal(expected)
	if string(got) != string(want) {
		t.Fatalf("snapshot %s, want %s", got, want)
	}
	if len(requests) != 3 || requests[0] != "/api/users/stream?telegramId=123&size=100" {
		t.Fatal(requests)
	}
}

func TestSupportHwidSchemasKeepFullModeContract(t *testing.T) {
	var full, scoped []toolDefinition
	_ = json.Unmarshal(toolData, &full)
	_ = json.Unmarshal(supportHwidData, &scoped)
	for _, definition := range scoped {
		if _, err := normalizeInput(definition.InputSchema, object{"userId": float64(7), "hwid": "device"}, ""); err == nil {
			t.Fatalf("%s accepted a support request without Telegram identity", definition.Name)
		}
		if _, err := normalizeInput(definition.InputSchema, object{"telegramId": "123", "userId": float64(7), "hwid": "device"}, ""); err == nil {
			t.Fatalf("%s accepted a nonnumeric Telegram identity", definition.Name)
		}
	}
	for _, definition := range full {
		if definition.Name != "hwid_device_delete" && definition.Name != "hwid_devices_list" {
			continue
		}
		if _, err := normalizeInput(definition.InputSchema, object{"userId": float64(7), "hwid": "device"}, ""); err != nil {
			t.Fatalf("full-mode %s changed its input contract: %v", definition.Name, err)
		}
	}
}
