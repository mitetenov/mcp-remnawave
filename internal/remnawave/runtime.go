// Package remnawave implements the complete Remnawave MCP 3.3.0 contract.
package remnawave

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"time"
)

type object = map[string]any
type undefined struct{}

var undef any = undefined{}

func isUndefined(v any) bool { _, ok := v.(undefined); return ok }
func get(v any, k string) any {
	if m, ok := v.(map[string]any); ok {
		if a, found := m[k]; found {
			return a
		}
	}
	return undef
}
func set(v any, k string, a any) {
	if m, ok := v.(map[string]any); ok {
		m[k] = a
	}
}
func merge(v ...any) object {
	m := object{}
	for _, a := range v {
		if n, ok := a.(map[string]any); ok {
			for k, x := range n {
				m[k] = x
			}
		}
	}
	for k, x := range m {
		if isUndefined(x) {
			delete(m, k)
		}
	}
	return m
}
func without(v any, keys ...string) object {
	m := merge(v)
	for _, k := range keys {
		delete(m, k)
	}
	return m
}
func equal(a, b any) bool { return reflect.DeepEqual(a, b) }
func truth(v any) bool {
	if v == nil || isUndefined(v) {
		return false
	}
	switch a := v.(type) {
	case bool:
		return a
	case string:
		return a != ""
	case float64:
		return a != 0 && !math.IsNaN(a)
	case int:
		return a != 0
	}
	return true
}
func choose(c, a, b any) any {
	if truth(c) {
		return a
	}
	return b
}
func coalesce(a, b any) any {
	if a == nil || isUndefined(a) {
		return b
	}
	return a
}
func arg(v []any, i int, def any) any {
	if i >= len(v) || isUndefined(v[i]) {
		return def
	}
	return v[i]
}
func str(v any) string {
	if isUndefined(v) {
		return "undefined"
	}
	if v == nil {
		return "null"
	}
	switch a := v.(type) {
	case string:
		return a
	case float64:
		return strconv.FormatFloat(a, 'f', -1, 64)
	case json.Number:
		return string(a)
	default:
		return fmt.Sprint(a)
	}
}

var clockNow = time.Now

func nowMillis() any { return clockNow().UnixMilli() }
func date(v any) any {
	var t time.Time
	var err error
	switch a := v.(type) {
	case int64:
		t = time.UnixMilli(a)
	case float64:
		t = time.UnixMilli(int64(a))
	case string:
		for _, layout := range []string{time.RFC3339Nano, "2006-01-02", "2006-01-02T15:04:05", "2006-01-02 15:04:05"} {
			t, err = time.Parse(layout, a)
			if err == nil {
				break
			}
		}
	default:
		return nil
	}
	if t.IsZero() || err != nil {
		return nil
	}
	return t.UTC().Format("2006-01-02T15:04:05.000Z")
}
func query(v any) string {
	m, ok := v.(map[string]any)
	if !ok {
		return ""
	}
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	q := url.Values{}
	for _, k := range keys {
		if !isUndefined(m[k]) {
			q.Set(k, str(m[k]))
		}
	}
	s := q.Encode()
	if s == "" {
		return s
	}
	return "?" + s
}
func subscriptionURL(v any) any {
	root, ok := v.(map[string]any)
	if !ok {
		root = object{}
	}
	r, ok := root["response"].(map[string]any)
	if !ok {
		r = root
	}
	users, _ := r["users"].([]any)
	urls := []string{}
	seen := map[string]bool{}
	for _, u := range users {
		s, ok := get(u, "subscriptionUrl").(string)
		if ok && strings.TrimSpace(s) != "" && !seen[s] {
			urls = append(urls, s)
			seen[s] = true
		}
	}
	if len(urls) == 1 {
		return object{"status": "found", "subscriptionUrl": urls[0]}
	}
	if len(urls) > 1 {
		return object{"status": "ambiguous", "subscriptionUrl": nil, "matchCount": len(urls)}
	}
	return object{"status": "not_found", "subscriptionUrl": nil}
}

var RedactedFields = []string{"trojanPassword", "ssPassword", "vlessUuid", "links", "ssConfLinks", "address", "ips", "port", "proxyUrl", "note", "provider", "system", "rawInbound"}

func redact(v any) {
	switch m := v.(type) {
	case map[string]any:
		for _, k := range RedactedFields {
			delete(m, k)
		}
		for _, a := range m {
			redact(a)
		}
	case []any:
		for _, a := range m {
			redact(a)
		}
	}
}

type Config struct {
	BaseURL, APIToken, APIKey string
	Support                   bool
	Timeout                   time.Duration
	HTTPClient                *http.Client
}

func LoadConfig() Config {
	ms, err := strconv.ParseFloat(strings.TrimSpace(os.Getenv("REMNAWAVE_TIMEOUT_MS")), 64)
	if err != nil || ms <= 0 || math.IsInf(ms, 0) || math.IsNaN(ms) {
		ms = 30000
	}
	return Config{BaseURL: strings.TrimRight(os.Getenv("REMNAWAVE_BASE_URL"), "/"), APIToken: os.Getenv("REMNAWAVE_API_TOKEN"), APIKey: os.Getenv("REMNAWAVE_API_KEY"), Support: os.Getenv("REMNAWAVE_IS_SUPPORT") != "false", Timeout: time.Duration(ms * float64(time.Millisecond))}
}

type executor struct {
	ctx    context.Context
	config Config
	err    error
}

func (e *executor) request(method string, values ...any) any {
	if e.err != nil {
		return nil
	}
	if e.config.BaseURL == "" || e.config.APIToken == "" {
		e.err = errors.New("MCP server is not configured. Set REMNAWAVE_BASE_URL and REMNAWAVE_API_TOKEN environment variables.") //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
		return nil
	}
	p := str(values[0])
	var body io.Reader
	if len(values) > 1 && !isUndefined(values[1]) {
		b, err := json.Marshal(values[1])
		if err != nil {
			e.err = err
			return nil
		}
		body = bytes.NewReader(b)
	}
	timeout := e.config.Timeout
	if timeout <= 0 {
		timeout = 30 * time.Second
	}
	ctx, cancel := context.WithTimeout(e.ctx, timeout)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, method, e.config.BaseURL+p, body)
	if err != nil {
		e.err = err
		return nil
	}
	req.Header.Set("Authorization", "Bearer "+e.config.APIToken)
	req.Header.Set("Content-Type", "application/json")
	if e.config.APIKey != "" {
		req.Header.Set("X-Api-Key", e.config.APIKey)
	}
	client := e.config.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}
	res, err := client.Do(req)
	if err != nil {
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			e.err = fmt.Errorf("Remnawave API timeout: %s %s did not respond within %sms", method, p, str(float64(timeout)/float64(time.Millisecond))) //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
		} else {
			e.err = errors.New("fetch failed")
		}
		return nil
	}
	defer res.Body.Close()
	b, err := io.ReadAll(res.Body)
	if err != nil {
		e.err = err
		return nil
	}
	var data any
	parseErr := json.Unmarshal(b, &data)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		msg := ""
		if parseErr == nil {
			if v := get(data, "message"); truth(v) {
				msg = str(v)
			} else {
				x, _ := json.Marshal(data)
				msg = string(x)
			}
		} else {
			msg = fmt.Sprintf("HTTP %d %s", res.StatusCode, http.StatusText(res.StatusCode))
		}
		e.err = fmt.Errorf("Remnawave API error: %s", msg) //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
		return nil
	}
	if parseErr != nil {
		e.err = invalidJSONError(b, parseErr)
		return nil
	}
	if e.config.Support {
		redact(data)
	}
	return data
}

// Match the original fetch JSON decoder for primitive malformed responses.
// Structured syntax failures retain their useful parsing location.
func invalidJSONError(b []byte, parseErr error) error {
	trimmed := strings.TrimSpace(string(b))
	if trimmed == "" {
		return errors.New("Unexpected end of JSON input") //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
	}
	var syntax *json.SyntaxError
	if errors.As(parseErr, &syntax) && syntax.Offset > 0 && int(syntax.Offset) <= len(b) && !strings.HasPrefix(trimmed, "{") && !strings.HasPrefix(trimmed, "[") {
		token := string(b[syntax.Offset-1])
		return fmt.Errorf("Unexpected token '%s', %q is not valid JSON", token, trimmed) //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
	}
	return fmt.Errorf("Unexpected token in JSON response: %w", parseErr) //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
}
