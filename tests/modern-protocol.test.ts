import http, { type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
    CLIENT_CAPABILITIES_META_KEY,
    McpServer,
    PROTOCOL_VERSION_META_KEY,
    createMcpHandler,
} from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
import { createHttpHandler } from '../src/http-handler.js';
import { HttpSessionManager } from '../src/http-session-manager.js';

const MODERN_PROTOCOL_VERSION = '2026-07-28';
const LEGACY_PROTOCOL_VERSION = '2025-11-25';

function testServerFactory(): McpServer {
    const server = new McpServer({ name: 'dual-era-test', version: '1.0.0' });
    server.registerTool('ping', { description: 'Test tool', inputSchema: z.object({}) }, async () => ({
        content: [{ type: 'text', text: 'pong' }],
    }));
    return server;
}

type Running = {
    server: Server;
    legacy: HttpSessionManager;
    modern: ReturnType<typeof createMcpHandler>;
    url: string;
};

const running: Running[] = [];

async function start(): Promise<Running> {
    const legacy = new HttpSessionManager(testServerFactory);
    // Matches src/http-index.ts's composition exactly: a strict modern
    // handler (`legacy: 'reject'`) served alongside the sessionful legacy
    // manager, dispatched by createHttpHandler's isLegacyRequest routing.
    const modern = createMcpHandler(testServerFactory, {
        legacy: 'reject',
        responseMode: 'json',
    });
    const modernNode = toNodeHandler(modern);
    const server = http.createServer(createHttpHandler({ legacy, modern: modernNode }));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    const instance = { server, legacy, modern, url: `http://127.0.0.1:${address.port}/` };
    running.push(instance);
    return instance;
}

async function stop(instance: Running): Promise<void> {
    await Promise.allSettled([instance.modern.close(), instance.legacy.closeAll()]);
    await new Promise<void>((resolve, reject) =>
        instance.server.close((error) => (error ? reject(error) : resolve())),
    );
}

beforeAll(() => {
    // createMcpHandler({ responseMode: 'json' }) logs one console.warn per
    // instance ("drops mid-call notifications") — expected given the brief's
    // explicit responseMode choice, and not something a public option
    // suppresses. Silenced here so `npm test` output stays readable.
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterAll(() => {
    vi.restoreAllMocks();
});

afterEach(async () => {
    for (const instance of running.splice(0)) {
        await stop(instance);
    }
});

function modernEnvelope(): Record<string, unknown> {
    return {
        [PROTOCOL_VERSION_META_KEY]: MODERN_PROTOCOL_VERSION,
        [CLIENT_CAPABILITIES_META_KEY]: {},
    };
}

async function modernCall(
    url: string,
    method: string,
    body: object,
    extraHeaders: Record<string, string> = {},
): Promise<Response> {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Mcp-Method': method,
            'MCP-Protocol-Version': MODERN_PROTOCOL_VERSION,
            ...extraHeaders,
        },
        body: JSON.stringify(body),
    });
}

async function legacyInitialize(url: string, name: string): Promise<string> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: LEGACY_PROTOCOL_VERSION,
                capabilities: {},
                clientInfo: { name, version: '1.0.0' },
            },
        }),
    });
    expect(response.status).toBe(200);
    const sessionId = response.headers.get('mcp-session-id');
    expect(sessionId).toBeTruthy();
    return sessionId!;
}

describe('modern (2026-07-28) protocol era', () => {
    it('serves server/discover, tools/list, and one tools/call with no Mcp-Session-Id', async () => {
        const { url } = await start();

        const discover = await modernCall(url, 'server/discover', {
            jsonrpc: '2.0', id: 1, method: 'server/discover', params: { _meta: modernEnvelope() },
        });
        expect(discover.status).toBe(200);
        expect(discover.headers.get('mcp-session-id')).toBeNull();
        const discoverBody = (await discover.json()) as { result: { supportedVersions: string[] } };
        expect(discoverBody.result.supportedVersions).toContain(MODERN_PROTOCOL_VERSION);

        const list = await modernCall(url, 'tools/list', {
            jsonrpc: '2.0', id: 2, method: 'tools/list', params: { _meta: modernEnvelope() },
        });
        expect(list.status).toBe(200);
        expect(list.headers.get('mcp-session-id')).toBeNull();
        const listBody = (await list.json()) as { result: { tools: Array<{ name: string }> } };
        expect(listBody.result.tools).toEqual([expect.objectContaining({ name: 'ping' })]);

        const call = await modernCall(
            url,
            'tools/call',
            { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ping', arguments: {}, _meta: modernEnvelope() } },
            { 'Mcp-Name': 'ping' },
        );
        expect(call.status).toBe(200);
        expect(call.headers.get('mcp-session-id')).toBeNull();
        const callBody = (await call.json()) as { result: { content: Array<{ type: string; text: string }> } };
        expect(callBody.result.content).toEqual([{ type: 'text', text: 'pong' }]);
    });

    it('serves modern and legacy traffic side by side, neither owning the other\'s state', async () => {
        const { url } = await start();

        const sessionId = await legacyInitialize(url, 'legacy-client');

        const modernList = await modernCall(url, 'tools/list', {
            jsonrpc: '2.0', id: 2, method: 'tools/list', params: { _meta: modernEnvelope() },
        });
        expect(modernList.status).toBe(200);
        expect(modernList.headers.get('mcp-session-id')).toBeNull();

        // The legacy session is still independently usable afterwards.
        const legacyList = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream',
                'Mcp-Session-Id': sessionId,
                'Mcp-Protocol-Version': LEGACY_PROTOCOL_VERSION,
            },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }),
        });
        expect(legacyList.status).toBe(202);
    });

    it('a server restart drops legacy sessions (404) but never touches a fresh modern call', async () => {
        const first = await start();
        const sessionId = await legacyInitialize(first.url, 'legacy-client');

        // Simulate a process restart: tear this instance down entirely and
        // stand up a brand-new one (fresh session map, fresh modern handler).
        await stop(first);
        running.splice(running.indexOf(first), 1);

        const second = await start();

        const staleSession = await fetch(second.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream',
                'Mcp-Session-Id': sessionId,
                'Mcp-Protocol-Version': LEGACY_PROTOCOL_VERSION,
            },
            body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
        });
        expect(staleSession.status).toBe(404);

        const freshModernCall = await modernCall(second.url, 'tools/list', {
            jsonrpc: '2.0', id: 3, method: 'tools/list', params: { _meta: modernEnvelope() },
        });
        expect(freshModernCall.status).toBe(200);
        expect(freshModernCall.headers.get('mcp-session-id')).toBeNull();
    });
});
