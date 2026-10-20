package remnawave

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func decodeRPC(t *testing.T, r *http.Response) object {
	t.Helper()
	b, err := io.ReadAll(r.Body)
	r.Body.Close()
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(r.Header.Get("Content-Type"), "text/event-stream") {
		for _, line := range strings.Split(string(b), "\n") {
			if strings.HasPrefix(line, "data: ") {
				b = []byte(strings.TrimPrefix(line, "data: "))
				break
			}
		}
	}
	var out object
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("JSON response %s: %v", b, err)
	}
	return out
}
func requestRPC(t *testing.T, client *http.Client, address, method string, params any, headers map[string]string) *http.Response {
	t.Helper()
	body, _ := json.Marshal(object{"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
	r, _ := http.NewRequest("POST", address, bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	r.Header.Set("Accept", "application/json, text/event-stream")
	for k, v := range headers {
		r.Header.Set(k, v)
	}
	res, err := client.Do(r)
	if err != nil {
		t.Fatal(err)
	}
	return res
}
func TestHTTPProtocolEras(t *testing.T) {
	h := NewHTTPHandler(Config{Support: true})
	server := httptest.NewServer(h)
	defer server.Close()
	defer h.Close()
	client := server.Client()
	initialize := func() string {
		res := requestRPC(t, client, server.URL, "initialize", object{"protocolVersion": "2025-11-25", "capabilities": object{}, "clientInfo": object{"name": "test", "version": "1"}}, nil)
		if res.StatusCode != 200 {
			t.Fatal(res.Status)
		}
		sid := res.Header.Get("Mcp-Session-Id")
		if sid == "" {
			t.Fatal("missing session")
		}
		out := decodeRPC(t, res)
		if get(get(out, "result"), "protocolVersion") != "2025-11-25" {
			t.Fatal(out)
		}
		return sid
	}
	a, b := initialize(), initialize()
	if a == b {
		t.Fatal("sessions reused")
	}
	for _, sid := range []string{a, b} {
		res := requestRPC(t, client, server.URL, "tools/list", object{}, map[string]string{"Mcp-Session-Id": sid, "MCP-Protocol-Version": "2025-11-25"})
		if res.StatusCode != 200 || res.Header.Get("Mcp-Session-Id") != sid {
			t.Fatalf("session continuation %d %v", res.StatusCode, res.Header)
		}
		out := get(decodeRPC(t, res), "result").(map[string]any)
		if _, ok := out["cacheScope"]; ok {
			t.Fatal("legacy public caching metadata")
		}
		tools := out["tools"].([]any)
		if len(tools) != 17 {
			t.Fatal(len(tools))
		}
	}
	meta := object{"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": object{}}
	for _, method := range []string{"server/discover", "tools/list", "resources/list", "resources/templates/list", "prompts/list"} {
		t.Run("modern "+method, func(t *testing.T) {
			res := requestRPC(t, client, server.URL, method, object{"_meta": meta}, map[string]string{"Mcp-Method": method, "MCP-Protocol-Version": "2026-07-28", "Mcp-Session-Id": "ignored-session"})
			if res.StatusCode != 200 || res.Header.Get("Mcp-Session-Id") != "" {
				t.Fatal(res.Status, res.Header)
			}
			out := get(decodeRPC(t, res), "result").(map[string]any)
			if out["cacheScope"] != "private" || out["resultType"] != "complete" || isUndefined(get(out, "_meta")) {
				t.Fatal(out)
			}
			if method == "server/discover" {
				versions := out["supportedVersions"].([]any)
				if len(versions) != 1 || versions[0] != "2026-07-28" {
					t.Fatal(versions)
				}
			}
		})
	}
	req, _ := http.NewRequest("DELETE", server.URL, nil)
	req.Header.Set("Mcp-Session-Id", a)
	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != 200 {
		t.Fatal(res.Status)
	}
	res = requestRPC(t, client, server.URL, "tools/list", object{}, map[string]string{"Mcp-Session-Id": a})
	if res.StatusCode != 404 {
		t.Fatal(res.Status)
	}
	if get(get(decodeRPC(t, res), "error"), "message") != "Session not found" {
		t.Fatal("session error")
	}
	res = requestRPC(t, client, server.URL, "tools/list", object{}, map[string]string{"Mcp-Session-Id": b})
	if res.StatusCode != 200 {
		t.Fatal("sibling session closed")
	}
	res.Body.Close()
}
func TestHTTPValidation(t *testing.T) {
	h := NewHTTPHandler(Config{Support: true})
	defer h.Close()
	for _, tc := range []struct {
		Name, Method, Path, Host, Origin, Content, Accept, Body string
		Status                                                  int
		Message                                                 string
	}{{Name: "health", Method: "GET", Path: "/health", Host: "attacker.example", Status: 200}, {Name: "path", Method: "GET", Path: "/other", Status: 405}, {Name: "method", Method: "PUT", Path: "/", Status: 405}, {Name: "host", Method: "POST", Path: "/", Host: "attacker.example", Status: 403, Message: "Invalid Host: attacker.example"}, {Name: "origin", Method: "POST", Path: "/", Origin: "http://attacker.example", Status: 403, Message: "Invalid Origin: attacker.example"}, {Name: "null origin", Method: "POST", Path: "/", Origin: "null", Status: 403, Message: "Invalid Origin header: null"}, {Name: "media", Method: "POST", Path: "/", Content: "text/plain", Status: 415, Message: "Unsupported Media Type: Content-Type must be application/json"}, {Name: "malformed", Method: "POST", Path: "/", Content: "application/json", Body: "{", Status: 400, Message: "Bad Request: No valid session ID provided"}, {Name: "missing session", Method: "GET", Path: "/", Status: 400, Message: "Bad Request: No session ID provided"}, {Name: "accept", Method: "POST", Path: "/", Content: "application/json", Accept: "application/json", Body: `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}`, Status: 406, Message: "Not Acceptable: Client must accept both application/json and text/event-stream"}} {
		t.Run(tc.Name, func(t *testing.T) {
			r := httptest.NewRequest(tc.Method, "http://localhost"+tc.Path, strings.NewReader(tc.Body))
			if tc.Host != "" {
				r.Host = tc.Host
			}
			r.Header.Set("Origin", tc.Origin)
			r.Header.Set("Content-Type", tc.Content)
			r.Header.Set("Accept", tc.Accept)
			w := httptest.NewRecorder()
			h.ServeHTTP(w, r)
			if w.Code != tc.Status {
				t.Fatalf("%d %s", w.Code, w.Body)
			}
			if tc.Message != "" {
				var out object
				if err := json.Unmarshal(w.Body.Bytes(), &out); err != nil {
					t.Fatal(err)
				}
				if get(get(out, "error"), "message") != tc.Message {
					t.Fatal(out)
				}
			}
		})
	}
}
