import http, { type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { createHttpHandler } from '../src/http-handler.js';
import { HttpSessionManager } from '../src/http-session-manager.js';

const PROTOCOL_VERSION = '2025-11-25';

type Running = {
    server: Server;
    sessions: HttpSessionManager;
    url: string;
};

const running: Running[] = [];

function testMcpServer(): McpServer {
    const server = new McpServer({ name: 'session-test', version: '1.0.0' });
    server.registerTool('ping', { description: 'Test tool', inputSchema: z.object({}) }, async () => ({
        content: [{ type: 'text', text: 'pong' }],
    }));
    return server;
}

async function start(): Promise<Running> {
    const sessions = new HttpSessionManager(testMcpServer);
    const server = http.createServer(createHttpHandler(sessions));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    const instance = { server, sessions, url: `http://127.0.0.1:${address.port}/` };
    running.push(instance);
    return instance;
}

async function jsonRpc(response: Response): Promise<Record<string, unknown>> {
    const text = await response.text();
    const data = text
        .split('\n')
        .find((line) => line.startsWith('data: '))
        ?.slice('data: '.length);
    return JSON.parse(data ?? text) as Record<string, unknown>;
}

async function initialize(url: string, name: string): Promise<string> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: PROTOCOL_VERSION,
                capabilities: {},
                clientInfo: { name, version: '1.0.0' },
            },
        }),
    });
    expect(response.status).toBe(200);
    await jsonRpc(response);
    const sessionId = response.headers.get('mcp-session-id');
    expect(sessionId).toBeTruthy();
    return sessionId!;
}

async function post(url: string, sessionId: string, message: object): Promise<Response> {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            'Mcp-Session-Id': sessionId,
            'Mcp-Protocol-Version': PROTOCOL_VERSION,
        },
        body: JSON.stringify(message),
    });
}

async function markInitialized(url: string, sessionId: string): Promise<void> {
    const response = await post(url, sessionId, {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {},
    });
    expect(response.status).toBe(202);
}

afterEach(async () => {
    for (const instance of running.splice(0)) {
        await instance.sessions.closeAll();
        await new Promise<void>((resolve, reject) =>
            instance.server.close((error) => (error ? reject(error) : resolve())),
        );
    }
});

describe('HttpSessionManager', () => {
    it('allows two clients to initialize and list tools independently', async () => {
        const { url } = await start();

        const sessionA = await initialize(url, 'client-a');
        const sessionB = await initialize(url, 'client-b');
        expect(sessionA).not.toBe(sessionB);

        await markInitialized(url, sessionA);
        await markInitialized(url, sessionB);

        const listA = await post(url, sessionA, {
            jsonrpc: '2.0', id: 2, method: 'tools/list', params: {},
        });
        const listB = await post(url, sessionB, {
            jsonrpc: '2.0', id: 2, method: 'tools/list', params: {},
        });

        expect(listA.status).toBe(200);
        expect(listB.status).toBe(200);
        expect(await jsonRpc(listA)).toMatchObject({
            result: { tools: [{ name: 'ping' }] },
        });
        expect(await jsonRpc(listB)).toMatchObject({
            result: { tools: [{ name: 'ping' }] },
        });
    });

    it('deletes one session without breaking another or blocking a replacement', async () => {
        const { url } = await start();
        const sessionA = await initialize(url, 'client-a');
        const sessionB = await initialize(url, 'client-b');
        await markInitialized(url, sessionA);
        await markInitialized(url, sessionB);

        const deleted = await fetch(url, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json, text/event-stream',
                'Mcp-Session-Id': sessionA,
                'Mcp-Protocol-Version': PROTOCOL_VERSION,
            },
        });
        expect(deleted.status).toBe(200);

        const dead = await post(url, sessionA, {
            jsonrpc: '2.0', id: 3, method: 'tools/list', params: {},
        });
        expect(dead.status).toBe(404);

        const live = await post(url, sessionB, {
            jsonrpc: '2.0', id: 3, method: 'tools/list', params: {},
        });
        expect(live.status).toBe(200);

        const sessionC = await initialize(url, 'client-c');
        expect(sessionC).not.toBe(sessionA);
        expect(sessionC).not.toBe(sessionB);
    });

    it('distinguishes a missing session from an unknown supplied session', async () => {
        const { url } = await start();

        const missing = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify({
                jsonrpc: '2.0', id: 1, method: 'tools/list', params: {},
            }),
        });
        expect(missing.status).toBe(400);

        const unknown = await post(url, 'unknown-session', {
            jsonrpc: '2.0', id: 2, method: 'tools/list', params: {},
        });
        expect(unknown.status).toBe(404);
    });
});
