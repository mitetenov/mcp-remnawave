package remnawave

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/modelcontextprotocol/go-sdk/jsonrpc"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// compatibleResult retains the SDK's result type while preserving the existing
// public wire contract. In particular, legacy private user resources must not
// acquire the Go SDK's new default public caching metadata.
type compatibleResult struct {
	mcp.Result
	value object
}

func (r compatibleResult) MarshalJSON() ([]byte, error) { return json.Marshal(r.value) }
func compatibility(next mcp.MethodHandler) mcp.MethodHandler {
	return func(ctx context.Context, method string, req mcp.Request) (mcp.Result, error) {
		result, err := next(ctx, method, req)
		if err != nil {
			var rpc *jsonrpc.Error
			if errors.As(err, &rpc) {
				copy := *rpc
				if method == "tools/call" {
					p := req.GetParams().(*mcp.CallToolParamsRaw)
					copy.Message = fmt.Sprintf("Tool %s not found", p.Name)
				}
				if method == "resources/read" {
					p := req.GetParams().(*mcp.ReadResourceParams)
					copy.Message = "Resource not found: " + p.URI
				}
				return nil, &copy
			}
			return result, err
		}
		if result == nil {
			return nil, nil
		}
		switch method {
		case "tools/list", "resources/list", "resources/templates/list", "resources/read", "prompts/list", "prompts/get", "server/discover":
		default:
			return result, nil
		}
		b, err := json.Marshal(result)
		if err != nil {
			return nil, err
		}
		var value object
		if err = json.Unmarshal(b, &value); err != nil {
			return nil, err
		}
		modern := false
		if req.GetParams() != nil {
			for _, v := range req.GetParams().GetMeta() {
				if version, ok := v.(string); ok && version == "2026-07-28" {
					modern = true
				}
			}
		}
		if x := req.GetExtra(); x != nil && x.Header.Get("MCP-Protocol-Version") == "2026-07-28" {
			modern = true
		}
		if session, ok := req.GetSession().(*mcp.ServerSession); ok {
			if p := session.InitializeParams(); p != nil && p.ProtocolVersion == "2026-07-28" {
				modern = true
			}
		}
		if modern {
			value["resultType"] = "complete"
			meta, _ := value["_meta"].(map[string]any)
			if meta == nil {
				meta = object{}
			}
			meta["io.modelcontextprotocol/serverInfo"] = object{"name": "remnawave-mcp", "version": "3.3.0"}
			value["_meta"] = meta
			if method == "server/discover" {
				value["supportedVersions"] = []string{"2026-07-28"}
			}
			if _, ok := value["cacheScope"]; ok {
				value["cacheScope"] = "private"
			}
		} else {
			delete(value, "cacheScope")
			delete(value, "ttlMs")
		}

		// SDK collections are sorted internally; keep registration order used
		// by existing clients and prompt examples on the wire.
		key := ""
		order := []string{}
		switch method {
		case "tools/list":
			key = "tools"
			var definitions []toolDefinition
			_ = json.Unmarshal(toolData, &definitions)
			for _, d := range definitions {
				order = append(order, d.Name)
			}
		case "resources/list", "resources/templates/list", "prompts/list":
			var features map[string][]object
			_ = json.Unmarshal(featureData, &features)
			switch method {
			case "resources/list":
				key = "resources"
			case "resources/templates/list":
				key = "resourceTemplates"
			case "prompts/list":
				key = "prompts"
			}
			for _, d := range features[key] {
				order = append(order, str(d["name"]))
			}
		}
		if key != "" {
			if items, ok := value[key].([]any); ok {
				positions := map[string]int{}
				for i, n := range order {
					positions[n] = i
				}
				sort.SliceStable(items, func(i, j int) bool {
					return positions[str(get(items[i], "name"))] < positions[str(get(items[j], "name"))]
				})
			}
		}
		if method == "prompts/list" {
			if prompts, ok := value["prompts"].([]any); ok {
				for _, p := range prompts {
					m := p.(map[string]any)
					args, ok := m["arguments"].([]any)
					if !ok {
						m["arguments"] = []any{}
					}
					for _, a := range args {
						am := a.(map[string]any)
						if _, ok := am["required"]; !ok {
							am["required"] = false
						}
					}
				}
			}
		}
		return compatibleResult{Result: result, value: value}, nil
	}
}
func inputType(v any) string {
	if isUndefined(v) {
		return "undefined"
	}
	if v == nil {
		return "null"
	}
	switch v.(type) {
	case bool:
		return "boolean"
	case string:
		return "string"
	case float64:
		return "number"
	case []any:
		return "array"
	case map[string]any:
		return "object"
	}
	return "unknown"
}
func invalidType(path, expected string, v any) error {
	return fmt.Errorf("%s: Invalid input: expected %s, received %s", strings.TrimPrefix(path, "."), expected, inputType(v))
}
func validationResult(name string, err error) *mcp.CallToolResult {
	return &mcp.CallToolResult{IsError: true, Content: []mcp.Content{&mcp.TextContent{Text: fmt.Sprintf("Input validation error: Invalid arguments for tool %s: %v", name, err)}}}
}
