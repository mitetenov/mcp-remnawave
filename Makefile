.PHONY: build test check
build:
	go build -trimpath -o bin/remnawave-mcp ./cmd/remnawave-mcp
test:
	go test -race ./...
check:
	go vet ./...
