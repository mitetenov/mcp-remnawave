package remnawave

import (
	"bytes"
	"encoding/json"
	"io"
	"mime"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type HTTPHandler struct {
	legacy, modern *mcp.StreamableHTTPHandler
	mu             sync.Mutex
	servers        []*mcp.Server
	sessions       map[string]bool
}

func NewHTTPHandler(c Config) *HTTPHandler {
	h := &HTTPHandler{sessions: map[string]bool{}}
	server := NewServer(c)
	h.servers = append(h.servers, server)
	factory := func(*http.Request) *mcp.Server { return server }
	h.legacy = mcp.NewStreamableHTTPHandler(factory, &mcp.StreamableHTTPOptions{DisableLocalhostProtection: true, MaxRequestBodyBytes: -1})
	h.modern = mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server { return NewServer(c) }, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true, DisableLocalhostProtection: true, MaxRequestBodyBytes: -1})
	return h
}
func (h *HTTPHandler) Close() error {
	h.mu.Lock()
	s := h.servers
	h.servers = nil
	h.sessions = map[string]bool{}
	h.mu.Unlock()
	for _, server := range s {
		for session := range server.Sessions() {
			_ = session.Close()
		}
	}
	return nil
}
func rpcError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(object{"jsonrpc": "2.0", "id": nil, "error": object{"code": -32000, "message": message}})
}
func allowedHost(host string) bool {
	host = strings.ToLower(host)
	if strings.Contains(host, ":") {
		if h, _, err := net.SplitHostPort(host); err == nil {
			host = h
		}
	}
	return host == "localhost" || host == "127.0.0.1" || host == "::1" || host == "[::1]" || host == "mcp-remnawave"
}
func (h *HTTPHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" && r.URL.RequestURI() == "/health" {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
		return
	}
	if r.URL.RequestURI() != "/" || (r.Method != "POST" && r.Method != "GET" && r.Method != "DELETE") {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(405)
		_, _ = w.Write([]byte("Method Not Allowed"))
		return
	}
	if !allowedHost(r.Host) {
		rpcError(w, 403, "Invalid Host: "+hostname(r.Host))
		return
	}
	if origin := r.Header.Get("Origin"); origin != "" {
		u, err := url.Parse(origin)
		if err != nil || !allowedHost(u.Host) {
			if err != nil || u.Host == "" {
				rpcError(w, 403, "Invalid Origin header: "+origin)
			} else {
				rpcError(w, 403, "Invalid Origin: "+hostname(u.Host))
			}
			return
		}
	}
	var body object
	if r.Method == "POST" {
		media, _, _ := mime.ParseMediaType(r.Header.Get("Content-Type"))
		if media != "application/json" {
			rpcError(w, 415, "Unsupported Media Type: Content-Type must be application/json")
			return
		}
		b, err := io.ReadAll(r.Body)
		if err != nil {
			rpcError(w, 400, "Bad Request: No valid session ID provided")
			return
		}
		_ = json.Unmarshal(b, &body)
		r.Body = io.NopCloser(bytes.NewReader(b))
	}
	modern := r.Header.Get("MCP-Protocol-Version") == "2026-07-28" || r.Header.Get("Mcp-Method") != ""
	if !modern && body != nil {
		if meta, ok := get(get(body, "params"), "_meta").(map[string]any); ok {
			for _, v := range meta {
				if version, ok := v.(string); ok && version == "2026-07-28" {
					modern = true
				}
			}
		}
	}
	if modern {
		h.modern.ServeHTTP(w, r)
		return
	}
	if r.Header.Get("Mcp-Session-Id") == "" {
		if r.Method != "POST" {
			rpcError(w, 400, "Bad Request: No session ID provided")
			return
		}
		if get(body, "method") != "initialize" {
			rpcError(w, 400, "Bad Request: No valid session ID provided")
			return
		}
	}
	sid := r.Header.Get("Mcp-Session-Id")
	if sid != "" {
		h.mu.Lock()
		exists := h.sessions[sid]
		h.mu.Unlock()
		if !exists {
			rpcError(w, 404, "Session not found")
			return
		}
	}
	if r.Method == "POST" {
		accept := r.Header.Get("Accept")
		if !strings.Contains(accept, "application/json") || !strings.Contains(accept, "text/event-stream") {
			rpcError(w, 406, "Not Acceptable: Client must accept both application/json and text/event-stream")
			return
		}
	}
	h.legacy.ServeHTTP(&legacyWriter{ResponseWriter: w, handler: h, sessionID: sid, method: r.Method}, r)
}

func hostname(host string) string {
	if h, _, err := net.SplitHostPort(host); err == nil {
		return h
	}
	return strings.Trim(host, "[]")
}

// legacyWriter preserves the Node transport's status/header contract while the
// maintained SDK owns actual session and SSE lifecycle management.
type legacyWriter struct {
	http.ResponseWriter
	handler           *HTTPHandler
	sessionID, method string
	wrote             bool
}

func (w *legacyWriter) Unwrap() http.ResponseWriter { return w.ResponseWriter }
func (w *legacyWriter) Flush() {
	if f, ok := w.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}
func (w *legacyWriter) WriteHeader(status int) {
	if w.wrote {
		return
	}
	w.wrote = true
	sid := w.Header().Get("Mcp-Session-Id")
	if sid != "" {
		w.handler.mu.Lock()
		w.handler.sessions[sid] = true
		w.handler.mu.Unlock()
	}
	if status == 200 && w.sessionID != "" {
		w.Header().Set("Mcp-Session-Id", w.sessionID)
	}
	if status == 202 {
		w.Header().Set("Content-Type", "text/plain")
	}
	if status == 204 && w.method == "DELETE" {
		status = 200
		w.Header().Set("Content-Type", "text/plain")
		w.Header().Del("Mcp-Session-Id")
		w.handler.mu.Lock()
		delete(w.handler.sessions, w.sessionID)
		w.handler.mu.Unlock()
	}
	w.ResponseWriter.WriteHeader(status)
}

func (w *legacyWriter) Write(b []byte) (int, error) {
	if !w.wrote {
		w.WriteHeader(http.StatusOK)
	}
	return w.ResponseWriter.Write(b)
}
