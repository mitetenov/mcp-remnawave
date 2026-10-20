package main

import (
	"context"
	"fmt"
	"github.com/mitetenov/mcp-remnawave/internal/remnawave"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

func main() {
	mode := "stdio"
	if len(os.Args) > 1 {
		mode = os.Args[1]
	}
	if mode == "version" || mode == "--version" {
		fmt.Println("3.3.0")
		return
	}
	port := os.Getenv("MCP_HTTP_PORT")
	if port == "" {
		port = "3100"
	}
	if mode == "healthcheck" {
		url := "http://localhost:" + port + "/health"
		if len(os.Args) > 2 {
			url = os.Args[2]
		}
		c := http.Client{Timeout: 3 * time.Second}
		r, err := c.Get(url)
		if err != nil {
			log.Fatal(err)
		}
		defer r.Body.Close()
		if r.StatusCode < 200 || r.StatusCode >= 300 {
			os.Exit(1)
		}
		return
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	config := remnawave.LoadConfig()
	if mode == "stdio" {
		if err := remnawave.NewServer(config).Run(ctx, &mcp.StdioTransport{}); err != nil && ctx.Err() == nil {
			log.Fatal(err)
		}
		return
	}
	if mode != "http" {
		log.Fatalf("unknown mode %q; use stdio, http, healthcheck, or version", mode)
	}
	if _, err := strconv.Atoi(port); err != nil {
		log.Fatalf("invalid MCP_HTTP_PORT: %s", port)
	}
	host := os.Getenv("MCP_HTTP_HOST")
	if host == "" {
		host = "0.0.0.0"
	}
	handler := remnawave.NewHTTPHandler(config)
	server := &http.Server{Addr: net.JoinHostPort(host, port), Handler: handler}
	go func() {
		<-ctx.Done()
		_ = handler.Close()
		closeCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = server.Shutdown(closeCtx)
	}()
	log.Printf("MCP Remnawave HTTP server listening on http://%s:%s", host, port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
