package main

import (
	"bufio"
	"encoding/json"
	"os"
	"os/exec"
	"testing"
	"time"
)

func TestHelperProcess(t *testing.T) {
	if os.Getenv("MCP_TEST_HELPER") != "1" {
		return
	}
	os.Args = []string{"remnawave-mcp", "stdio"}
	main()
	os.Exit(0)
}
func TestStdioSubprocess(t *testing.T) {
	cmd := exec.Command(os.Args[0], "-test.run=TestHelperProcess")
	cmd.Env = append(os.Environ(), "MCP_TEST_HELPER=1", "REMNAWAVE_IS_SUPPORT=true", "REMNAWAVE_BASE_URL=", "REMNAWAVE_API_TOKEN=")
	in, err := cmd.StdinPipe()
	if err != nil {
		t.Fatal(err)
	}
	out, err := cmd.StdoutPipe()
	if err != nil {
		t.Fatal(err)
	}
	if err = cmd.Start(); err != nil {
		t.Fatal(err)
	}
	defer cmd.Process.Kill()
	reader := bufio.NewReader(out)
	exchange := func(v any) map[string]any {
		b, _ := json.Marshal(v)
		if _, err := in.Write(append(b, '\n')); err != nil {
			t.Fatal(err)
		}
		done := make(chan []byte, 1)
		go func() { line, _ := reader.ReadBytes('\n'); done <- line }()
		select {
		case line := <-done:
			var decoded map[string]any
			if err := json.Unmarshal(line, &decoded); err != nil {
				t.Fatalf("%s %v", line, err)
			}
			return decoded
		case <-time.After(5 * time.Second):
			t.Fatal("stdio response timeout")
			return nil
		}
	}
	init := exchange(map[string]any{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": map[string]any{"protocolVersion": "2025-11-25", "capabilities": map[string]any{}, "clientInfo": map[string]any{"name": "subprocess-test", "version": "1"}}})
	if init["error"] != nil {
		t.Fatal(init)
	}
	list := exchange(map[string]any{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": map[string]any{}})
	result := list["result"].(map[string]any)
	if len(result["tools"].([]any)) != 17 {
		t.Fatal(result)
	}
	if _, ok := result["cacheScope"]; ok {
		t.Fatal("legacy cache metadata")
	}
	_ = in.Close()
	if err := cmd.Wait(); err != nil {
		t.Fatal(err)
	}
}
