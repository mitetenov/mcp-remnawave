import http, { type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/server';
import { type NodeMcpRequestHandler } from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
import { createHttpHandler, type McpRequestTarget } from '../src/http-handler.js';
import { HttpSessionManager } from '../src/http-session-manager.js';

const running: Server[] = [];

afterEach(() => {
    vi.restoreAllMocks();
    for (const server of running.splice(0)) {
        server.close();
    }
});

type Call = { method?: string; url?: string; body?: unknown };

function stubLegacy(): { target: McpRequestTarget; calls: Call[] } {
    const calls: Call[] = [];
    return {
        calls,
        target: {
            async handleRequest(req: IncomingMessage, res: ServerResponse, body?: unknown) {
                calls.push({ method: req.method, url: req.url, body });
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('legacy-handled');
            },
        },
    };
}

function stubModern(): { modern: NodeMcpRequestHandler; calls: Call[] } {
    const calls: Call[] = [];
    return {
        calls,
        modern: async (req, res, parsedBody?: unknown) => {
            calls.push({ method: req.method, url: req.url, body: parsedBody });
            (res as ServerResponse).writeHead(200, { 'Content-Type': 'text/plain' });
            (res as ServerResponse).end('modern-handled');
        },
    };
}

async function startServer(
    legacy: McpRequestTarget,
    modern: NodeMcpRequestHandler,
): Promise<{ server: Server; url: string; port: number }> {
    const server = http.createServer(createHttpHandler({ legacy, modern }));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    running.push(server);
    const address = server.address() as AddressInfo;
    return { server, port: address.port, url: `http://127.0.0.1:${address.port}/` };
}

/**
 * Raw `http.request`-based fetch that (unlike the Fetch API's `fetch`) lets a
 * test override the `Host` header — needed for the Host-allowlist tests,
 * since `fetch()` treats `Host` as a forbidden header and silently rewrites
 * it to the actual connection target.
 */
function rawRequest(
    port: number,
    options: { method?: string; path?: string; headers?: Record<string, string> },
    body?: string,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                host: '127.0.0.1',
                port,
                path: options.path ?? '/',
                method: options.method ?? 'GET',
                headers: options.headers,
            },
            (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    resolve({
                        status: res.statusCode ?? 0,
                        headers: res.headers,
                        body: Buffer.concat(chunks).toString('utf-8'),
                    });
                });
            },
        );
        req.on('error', reject);
        if (body !== undefined) req.write(body);
        req.end();
    });
}

describe('createHttpHandler', () => {
    it('answers GET /health with 200 so a container health check can reach it', async () => {
        const { target: legacy } = stubLegacy();
        const { modern } = stubModern();
        const { port } = await startServer(legacy, modern);

        const response = await rawRequest(port, { method: 'GET', path: '/health' });

        expect(response.status).toBe(200);
        expect(JSON.parse(response.body)).toEqual({ status: 'ok' });
    });

    it('rejects an unsupported method on the MCP endpoint', async () => {
        const { target: legacy, calls } = stubLegacy();
        const { modern } = stubModern();
        const { port } = await startServer(legacy, modern);

        const response = await rawRequest(port, { method: 'PUT', path: '/' });

        expect(response.status).toBe(405);
        expect(calls).toEqual([]);
    });

    it('rejects a path other than / for MCP traffic', async () => {
        const { target: legacy } = stubLegacy();
        const { modern } = stubModern();
        const { port } = await startServer(legacy, modern);

        const response = await rawRequest(port, { method: 'POST', path: '/other' });

        expect(response.status).toBe(405);
    });

    describe('Host/Origin allow/deny matrix', () => {
        it('allows a localhost Host header through to routing', async () => {
            const { target: legacy, calls } = stubLegacy();
            const { modern } = stubModern();
            const { port } = await startServer(legacy, modern);

            const response = await rawRequest(port, {
                method: 'DELETE',
                path: '/',
                headers: { Host: 'localhost' },
            });

            expect(response.status).toBe(200);
            expect(calls).toHaveLength(1);
        });

        it('allows the Docker Compose service hostname through to routing', async () => {
            const { target: legacy, calls } = stubLegacy();
            const { modern } = stubModern();
            const { port } = await startServer(legacy, modern);

            const response = await rawRequest(port, {
                method: 'DELETE',
                path: '/',
                headers: { Host: 'mcp-remnawave' },
            });

            expect(response.status).toBe(200);
            expect(calls).toHaveLength(1);
        });

        it('rejects an arbitrary Host header before MCP dispatch', async () => {
            const { target: legacy, calls } = stubLegacy();
            const { modern } = stubModern();
            const { port } = await startServer(legacy, modern);

            const response = await rawRequest(port, {
                method: 'DELETE',
                path: '/',
                headers: { Host: 'attacker.example' },
            });

            expect(response.status).toBe(403);
            expect(calls).toEqual([]);
        });

        it('allows an Origin header naming an allowed hostname', async () => {
            const { target: legacy, calls } = stubLegacy();
            const { modern } = stubModern();
            const { port } = await startServer(legacy, modern);

            const response = await rawRequest(port, {
                method: 'DELETE',
                path: '/',
                headers: { Host: 'localhost', Origin: 'http://localhost:5173' },
            });

            expect(response.status).toBe(200);
            expect(calls).toHaveLength(1);
        });

        it('rejects an Origin header naming a disallowed hostname', async () => {
            const { target: legacy, calls } = stubLegacy();
            const { modern } = stubModern();
            const { port } = await startServer(legacy, modern);

            const response = await rawRequest(port, {
                method: 'DELETE',
                path: '/',
                headers: { Host: 'localhost', Origin: 'http://attacker.example' },
            });

            expect(response.status).toBe(403);
            expect(calls).toEqual([]);
        });
    });

    describe('content type and JSON validation', () => {
        it('rejects a POST with no Content-Type header with 415, not 500', async () => {
            const { target: legacy, calls } = stubLegacy();
            const { modern } = stubModern();
            const { port } = await startServer(legacy, modern);

            const response = await rawRequest(
                port,
                { method: 'POST', path: '/', headers: { Host: 'localhost' } },
                '{"jsonrpc":"2.0","method":"tools/list","id":1}',
            );

            expect(response.status).toBe(415);
            expect(calls).toEqual([]);
        });

        it('rejects a POST with a non-JSON Content-Type with 415, not 500', async () => {
            const { target: legacy, calls } = stubLegacy();
            const { modern } = stubModern();
            const { port } = await startServer(legacy, modern);

            const response = await rawRequest(
                port,
                { method: 'POST', path: '/', headers: { Host: 'localhost', 'Content-Type': 'text/plain' } },
                'not json',
            );

            expect(response.status).toBe(415);
            expect(calls).toEqual([]);
        });

        it('answers malformed JSON with a 4xx from the legacy manager, not a 500', async () => {
            const sessions = new HttpSessionManager(() => new McpServer({ name: 'malformed-test', version: '1.0.0' }));
            const { modern } = stubModern();
            const { port } = await startServer(sessions, modern);

            const response = await rawRequest(
                port,
                { method: 'POST', path: '/', headers: { Host: 'localhost', 'Content-Type': 'application/json' } },
                '{not valid json',
            );

            expect(response.status).toBeLessThan(500);
            expect(response.status).toBeGreaterThanOrEqual(400);

            await sessions.closeAll();
        });

        it('parses a well-formed POST body and hands it to the legacy target', async () => {
            const { target: legacy, calls } = stubLegacy();
            const { modern } = stubModern();
            const { port } = await startServer(legacy, modern);

            await rawRequest(
                port,
                { method: 'POST', path: '/', headers: { Host: 'localhost', 'Content-Type': 'application/json' } },
                '{"jsonrpc":"2.0","method":"tools/list","id":1}',
            );

            expect(calls).toEqual([{
                method: 'POST',
                url: '/',
                body: { jsonrpc: '2.0', method: 'tools/list', id: 1 },
            }]);
        });
    });

    describe('era dispatch', () => {
        it('routes GET and DELETE (session operations) to the legacy target, never the modern one', async () => {
            const { target: legacy, calls: legacyCalls } = stubLegacy();
            const { modern, calls: modernCalls } = stubModern();
            const { port } = await startServer(legacy, modern);

            await rawRequest(port, { method: 'GET', path: '/', headers: { Host: 'localhost' } });
            await rawRequest(port, { method: 'DELETE', path: '/', headers: { Host: 'localhost' } });

            expect(legacyCalls).toHaveLength(2);
            expect(modernCalls).toHaveLength(0);
        });

        it('routes a claim-less POST (legacy handshake shape) to the legacy target', async () => {
            const { target: legacy, calls: legacyCalls } = stubLegacy();
            const { modern, calls: modernCalls } = stubModern();
            const { port } = await startServer(legacy, modern);

            await rawRequest(
                port,
                { method: 'POST', path: '/', headers: { Host: 'localhost', 'Content-Type': 'application/json' } },
                '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"c","version":"1"}}}',
            );

            expect(legacyCalls).toHaveLength(1);
            expect(modernCalls).toHaveLength(0);
        });
    });
});
