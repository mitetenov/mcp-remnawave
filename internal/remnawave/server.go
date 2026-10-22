package remnawave

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"unicode/utf16"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

//go:embed tools.json
var toolData []byte

//go:embed features.json
var featureData []byte

//go:embed support-hwid.json
var supportHwidData []byte

type toolDefinition struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	InputSchema object `json:"inputSchema"`
}

var supportTools = map[string]bool{"users_resolve": true, "users_get": true, "users_get_by_username": true, "users_get_by_short_uuid": true, "users_get_by_telegram_id": true, "users_get_subscription_url_by_telegram_id": true, "users_accessible_nodes": true, "subscriptions_get_by_user_id": true, "subscriptions_get_by_username": true, "subscriptions_get_by_short_uuid": true, "subscription_info": true, "bandwidth_user_usage": true, "hwid_devices_list": true, "hwid_device_delete": true, "hwid_devices_delete_all": true, "nodes_list": true, "nodes_get": true}

// normalizeInput follows Zod's object semantics: apply defaults and strip unknown
// object keys, while retaining catchall objects. Validation runs before any API call.
func normalizeInput(s object, v any, path string) (any, error) {
	if isUndefined(v) {
		if d, ok := s["default"]; ok {
			return d, nil
		}
		return undef, nil
	}
	if a, ok := s["anyOf"].([]any); ok {
		for _, branch := range a {
			if x, err := normalizeInput(branch.(map[string]any), v, path); err == nil {
				return x, nil
			}
		}
		return nil, fmt.Errorf("invalid value at %s", path)
	}
	if expected, ok := s["const"]; ok && !equal(expected, v) {
		return nil, fmt.Errorf("invalid literal at %s", path)
	}
	if a, ok := s["enum"].([]any); ok {
		found := false
		for _, x := range a {
			if equal(x, v) {
				found = true
			}
		}
		if !found {
			return nil, fmt.Errorf("invalid option at %s", path)
		}
	}
	switch s["type"] {
	case "string":
		if _, ok := v.(string); !ok {
			return nil, invalidType(path, "string", v)
		}
		if max, ok := s["maxLength"].(float64); ok && float64(len(utf16.Encode([]rune(v.(string))))) > max {
			return nil, fmt.Errorf("%s: Too big: expected string to have <=%v characters", strings.TrimPrefix(path, "."), max)
		}
	case "number", "integer":
		if _, ok := v.(float64); !ok {
			return nil, invalidType(path, "number", v)
		}
	case "boolean":
		if _, ok := v.(bool); !ok {
			return nil, invalidType(path, "boolean", v)
		}
	case "null":
		if v != nil {
			return nil, invalidType(path, "null", v)
		}
	case "array":
		a, ok := v.([]any)
		if !ok {
			return nil, invalidType(path, "array", v)
		}
		if min, ok := s["minItems"].(float64); ok && float64(len(a)) < min {
			return nil, fmt.Errorf("too few items at %s", path)
		}
		if max, ok := s["maxItems"].(float64); ok && float64(len(a)) > max {
			return nil, fmt.Errorf("too many items at %s", path)
		}
		if items, ok := s["items"].(map[string]any); ok {
			for i, x := range a {
				p, err := normalizeInput(items, x, path+"."+strconv.Itoa(i))
				if err != nil {
					return nil, err
				}
				a[i] = p
			}
		}
		return a, nil
	case "object":
		m, ok := v.(map[string]any)
		if !ok {
			return nil, invalidType(path, "object", v)
		}
		out := object{}
		properties, _ := s["properties"].(map[string]any)
		for k, raw := range properties {
			x, err := normalizeInput(raw.(map[string]any), get(m, k), path+"."+k)
			if err != nil {
				return nil, err
			}
			if !isUndefined(x) {
				out[k] = x
			}
		}
		if req, ok := s["required"].([]any); ok {
			for _, raw := range req {
				k := raw.(string)
				if _, ok := out[k]; !ok {
					return nil, invalidType(path+"."+k, str(get(properties[k], "type")), undef)
				}
			}
		}
		if a, ok := s["additionalProperties"]; ok && a != false {
			for k, x := range m {
				if _, exists := properties[k]; !exists {
					if as, ok := a.(map[string]any); ok {
						parsed, err := normalizeInput(as, x, path+"."+k)
						if err != nil {
							return nil, err
						}
						x = parsed
					}
					out[k] = x
				}
			}
		}
		return out, nil
	}
	return v, nil
}
func textResult(v any, err error) *mcp.CallToolResult {
	if err != nil {
		return &mcp.CallToolResult{IsError: true, Content: []mcp.Content{&mcp.TextContent{Text: "Error: " + err.Error()}}}
	}
	b, _ := json.MarshalIndent(v, "", "  ")
	return &mcp.CallToolResult{Content: []mcp.Content{&mcp.TextContent{Text: string(b)}}}
}
func NewServer(config Config) *mcp.Server {
	s := mcp.NewServer(&mcp.Implementation{Name: "remnawave-mcp", Version: "3.3.0"}, &mcp.ServerOptions{PageSize: 1000, Capabilities: &mcp.ServerCapabilities{Tools: &mcp.ToolCapabilities{ListChanged: true}, Resources: &mcp.ResourceCapabilities{ListChanged: true}, Prompts: &mcp.PromptCapabilities{ListChanged: true}}})
	s.AddReceivingMiddleware(compatibility)
	var tools []toolDefinition
	if err := json.Unmarshal(toolData, &tools); err != nil {
		panic(err)
	}
	if config.Support {
		var scoped []toolDefinition
		if err := json.Unmarshal(supportHwidData, &scoped); err != nil {
			panic(err)
		}
		for i := range tools {
			for _, definition := range scoped {
				if tools[i].Name == definition.Name {
					tools[i] = definition
				}
			}
		}
	}
	for _, d := range tools {
		if config.Support && !supportTools[d.Name] {
			continue
		}
		s.AddTool(&mcp.Tool{Name: d.Name, Description: d.Description, InputSchema: d.InputSchema}, func(ctx context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			var args object
			if len(req.Params.Arguments) == 0 {
				args = object{}
			} else if err := json.Unmarshal(req.Params.Arguments, &args); err != nil {
				return validationResult(d.Name, err), nil
			}
			v, err := normalizeInput(d.InputSchema, args, "")
			if err != nil {
				return validationResult(d.Name, err), nil
			}
			e := &executor{ctx: ctx, config: config}
			out := runTool(e, d.Name, v.(map[string]any))
			return textResult(out, e.err), nil
		})
	}
	var features struct {
		Resources []*mcp.Resource         `json:"resources"`
		Templates []*mcp.ResourceTemplate `json:"resourceTemplates"`
		Prompts   []*mcp.Prompt           `json:"prompts"`
	}
	if err := json.Unmarshal(featureData, &features); err != nil {
		panic(err)
	}
	read := func(ctx context.Context, req *mcp.ReadResourceRequest) (*mcp.ReadResourceResult, error) {
		e := &executor{ctx: ctx, config: config}
		uri := req.Params.URI
		var data any
		switch uri {
		case "remnawave://stats":
			data = e.getStats()
		case "remnawave://nodes":
			data = e.getNodes()
		case "remnawave://health":
			data = e.getHealth()
		default:
			idstr := strings.TrimPrefix(uri, "remnawave://users/")
			id, err := strconv.ParseFloat(idstr, 64)
			if err != nil {
				idstr = "NaN"
				data = e.getUserById(idstr)
			} else {
				data = e.getUserById(id)
			}
		}
		if e.err != nil {
			return nil, e.err
		}
		b, _ := json.MarshalIndent(data, "", "  ")
		return &mcp.ReadResourceResult{Contents: []*mcp.ResourceContents{{URI: uri, MIMEType: "application/json", Text: string(b)}}}, nil
	}
	for _, r := range features.Resources {
		if !config.Support {
			s.AddResource(r, read)
		}
	}
	for _, r := range features.Templates {
		s.AddResourceTemplate(r, read)
	}
	for _, p := range features.Prompts {
		if config.Support && p.Name != "user_audit" {
			continue
		}
		s.AddPrompt(p, func(ctx context.Context, req *mcp.GetPromptRequest) (*mcp.GetPromptResult, error) {
			args := object{}
			for k, v := range req.Params.Arguments {
				args[k] = v
			}
			for _, a := range p.Arguments {
				if a.Required {
					if _, ok := args[a.Name]; !ok {
						return nil, fmt.Errorf("Missing required argument: %s", a.Name) //nolint:staticcheck // ST1005: preserve the existing client-facing MCP error contract.
					}
				}
			}
			b, _ := json.Marshal(promptResult(p.Name, args))
			var out mcp.GetPromptResult
			if err := json.Unmarshal(b, &out); err != nil {
				return nil, err
			}
			return &out, nil
		})
	}
	return s
}
