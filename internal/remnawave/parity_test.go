package remnawave

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"reflect"
	"strings"
	"testing"
	"time"
)

type goldenRequest struct {
	Method, URL string
	Body        any
	Headers     map[string]string
}
type goldenFixture struct {
	Name      string
	Support   bool
	Variant   string
	Arguments object
	Requests  []goldenRequest
	Result    any
}

func TestLegacyGoldenParity(t *testing.T) {
	b, err := os.ReadFile("testdata/legacy-golden.json")
	if err != nil {
		t.Fatal(err)
	}
	var doc struct {
		Now      int64
		Payload  any
		Fixtures []goldenFixture
	}
	if err := json.Unmarshal(b, &doc); err != nil {
		t.Fatal(err)
	}
	clockNow = func() time.Time { return time.UnixMilli(doc.Now) }
	defer func() { clockNow = time.Now }()
	var tools []toolDefinition
	_ = json.Unmarshal(toolData, &tools)
	schemas := map[string]object{}
	for _, d := range tools {
		schemas[d.Name] = d.InputSchema
	}
	for _, f := range doc.Fixtures {
		t.Run(f.Name+"/"+f.Variant+"/support="+str(f.Support), func(t *testing.T) {
			var got []goldenRequest
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				b, _ := io.ReadAll(r.Body)
				var body any
				if len(b) > 0 {
					_ = json.Unmarshal(b, &body)
				}
				got = append(got, goldenRequest{Method: r.Method, URL: r.URL.RequestURI(), Body: body, Headers: map[string]string{"Authorization": r.Header.Get("Authorization"), "Content-Type": r.Header.Get("Content-Type"), "X-Api-Key": r.Header.Get("X-Api-Key")}})
				w.Header().Set("Content-Type", "application/json")
				_ = json.NewEncoder(w).Encode(doc.Payload)
			}))
			defer server.Close()
			args, err := normalizeInput(schemas[f.Name], f.Arguments, "")
			if err != nil {
				t.Fatal(err)
			}
			e := &executor{ctx: context.Background(), config: Config{BaseURL: server.URL, APIToken: "test-token", APIKey: "test-key", Support: f.Support}}
			out := runTool(e, f.Name, args.(map[string]any))
			if e.err != nil {
				t.Fatal(e.err)
			}
			outBytes, _ := json.Marshal(out)
			var normalized any
			_ = json.Unmarshal(outBytes, &normalized)
			if !reflect.DeepEqual(normalized, f.Result) {
				t.Errorf("result mismatch\ngot %s\nwant %v", outBytes, f.Result)
			}
			if len(got) != len(f.Requests) {
				t.Fatalf("request count %d != %d", len(got), len(f.Requests))
			}
			for i, r := range got {
				want := f.Requests[i]
				a, _ := url.Parse(r.URL)
				b, _ := url.Parse(want.URL)
				if r.Method != want.Method || a.Path != b.Path || !reflect.DeepEqual(a.Query(), b.Query()) || !reflect.DeepEqual(r.Body, want.Body) || !reflect.DeepEqual(r.Headers, want.Headers) {
					t.Errorf("request mismatch\ngot %#v\nwant %#v", r, want)
				}
			}
		})
	}
}
func TestConfiguration(t *testing.T) {
	for _, v := range []string{"", "true", "False", "FALSE", "0", " false", "false ", "typo"} {
		t.Run("support="+v, func(t *testing.T) {
			t.Setenv("REMNAWAVE_IS_SUPPORT", v)
			if !LoadConfig().Support {
				t.Fatal("support must fail closed")
			}
		})
	}
	t.Setenv("REMNAWAVE_IS_SUPPORT", "false")
	if LoadConfig().Support {
		t.Fatal("explicit false")
	}
	for _, v := range []string{"", "0", "-1", "junk", "NaN", "Infinity"} {
		t.Setenv("REMNAWAVE_TIMEOUT_MS", v)
		if LoadConfig().Timeout != 30*time.Second {
			t.Errorf("timeout default for %q", v)
		}
	}
	t.Setenv("REMNAWAVE_TIMEOUT_MS", "2500")
	t.Setenv("REMNAWAVE_BASE_URL", "https://example.invalid///")
	c := LoadConfig()
	if c.Timeout != 2500*time.Millisecond || c.BaseURL != "https://example.invalid" {
		t.Fatalf("config %#v", c)
	}
}
func TestSubscriptionProjection(t *testing.T) {
	for _, tc := range []struct {
		Name   string
		Input  any
		Status string
		Count  int
	}{{"absent", nil, "not_found", 0}, {"malformed", object{"response": object{"users": nil}}, "not_found", 0}, {"duplicate", object{"users": []any{object{"subscriptionUrl": "u"}, object{"subscriptionUrl": "u"}, object{"subscriptionUrl": "  "}}}, "found", 1}, {"ambiguous", object{"users": []any{object{"subscriptionUrl": "u"}, object{"subscriptionUrl": "v"}}}, "ambiguous", 2}} {
		t.Run(tc.Name, func(t *testing.T) {
			out := subscriptionURL(tc.Input).(map[string]any)
			if out["status"] != tc.Status {
				t.Fatal(out)
			}
			if tc.Status != "found" && out["subscriptionUrl"] != nil {
				t.Fatal("URL leaked")
			}
			if tc.Count > 1 && out["matchCount"] != tc.Count {
				t.Fatal(out)
			}
		})
	}
}
func TestRequestErrors(t *testing.T) {
	for _, tc := range []struct {
		Name   string
		Status int
		Body   string
		Want   string
	}{{"json", 400, `{"message":"invalid"}`, "Remnawave API error: invalid"}, {"json without message", 500, `{"other":true}`, `Remnawave API error: {"other":true}`}, {"text", 502, "upstream offline", "Remnawave API error: HTTP 502 Bad Gateway"}} {
		t.Run(tc.Name, func(t *testing.T) {
			s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.Status)
				_, _ = w.Write([]byte(tc.Body))
			}))
			defer s.Close()
			e := &executor{ctx: context.Background(), config: Config{BaseURL: s.URL, APIToken: "t"}}
			e.getNodes()
			if e.err == nil || e.err.Error() != tc.Want {
				t.Fatalf("%v", e.err)
			}
		})
	}
	t.Run("unconfigured", func(t *testing.T) {
		e := &executor{ctx: context.Background()}
		e.getNodes()
		if e.err == nil || !strings.Contains(e.err.Error(), "not configured") {
			t.Fatal(e.err)
		}
	})
	t.Run("timeout", func(t *testing.T) {
		s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			time.Sleep(30 * time.Millisecond)
			_, _ = w.Write([]byte(`{}`))
		}))
		defer s.Close()
		e := &executor{ctx: context.Background(), config: Config{BaseURL: s.URL, APIToken: "t", Timeout: 5 * time.Millisecond}}
		e.getNodes()
		if e.err == nil || e.err.Error() != "Remnawave API timeout: GET /api/nodes/ did not respond within 5ms" {
			t.Fatal(e.err)
		}
	})
}

func TestInputContractBoundaries(t *testing.T) {
	var definitions []toolDefinition
	_ = json.Unmarshal(toolData, &definitions)
	schemas := map[string]object{}
	for _, d := range definitions {
		schemas[d.Name] = d.InputSchema
	}
	cases := []struct {
		Name, Tool string
		Args       object
		Invalid    bool
	}{
		{"numeric id required", "users_get", object{"userId": "42"}, true},
		{"missing id", "users_get", object{}, true},
		{"reject null id", "users_get", object{"userId": nil}, true},
		{"node note length", "nodes_update", object{"uuid": "node", "note": strings.Repeat("a", 256)}, true},
		{"node note UTF16 length", "nodes_update", object{"uuid": "node", "note": strings.Repeat("😀", 128)}, true},
		{"node note at limit", "nodes_update", object{"uuid": "node", "note": strings.Repeat("a", 255)}, false},
		{"host tag count", "hosts_update", object{"uuid": "host", "tags": []any{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"}}, true},
		{"bandwidth nonempty nodes", "bandwidth_nodes_usage", object{"nodesUuids": []any{}, "start": "2026-10-01", "end": "2026-10-20"}, true},
		{"enum restriction", "users_bulk_delete_by_status", object{"status": "BOGUS"}, true},
	}
	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			_, err := normalizeInput(schemas[tc.Tool], tc.Args, "")
			if (err != nil) != tc.Invalid {
				t.Fatalf("validation err=%v", err)
			}
		})
	}
	t.Run("defaults and unknown stripping", func(t *testing.T) {
		got, err := normalizeInput(schemas["users_list"], object{"unrecognized": "drop"}, "")
		if err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(got, object{"start": float64(0), "size": float64(25)}) {
			t.Fatal(got)
		}
	})
	t.Run("catchall metadata", func(t *testing.T) {
		args := object{"uuid": "node", "metadata": object{"custom": object{"nested": []any{false, "value"}}}}
		got, err := normalizeInput(schemas["metadata_node_upsert"], args, "")
		if err != nil || !reflect.DeepEqual(got, args) {
			t.Fatal(got, err)
		}
	})
}
