import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { McpServer, isInitializeRequest } from '@modelcontextprotocol/server';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import type { McpRequestTarget } from './http-handler.js';

type ServerFactory = () => McpServer;

/**
 * One legacy (2025-era) session: the transport that owns the HTTP exchange
 * and the server instance connected to it. Both are closed together — a
 * session that outlives its server would leak registered tools/resources;
 * a server outliving its transport would leak the connection.
 */
type LegacySession = {
    transport: NodeStreamableHTTPServerTransport;
    server: McpServer;
};

/**
 * Owns every 2025-era (sessionful) Streamable HTTP exchange: the `initialize`
 * handshake, independent per-session GET (SSE resume) and POST traffic, and
 * DELETE session termination. This is the only owner of handshake traffic —
 * the modern (2026-07-28) leg served alongside it is stateless and never
 * issues or consumes a session ID.
 */
export class HttpSessionManager implements McpRequestTarget {
    private readonly sessions = new Map<string, LegacySession>();

    constructor(private readonly serverFactory: ServerFactory) {}

    async handleRequest(
        req: IncomingMessage,
        res: ServerResponse,
        body?: unknown,
    ): Promise<void> {
        const sessionId = this.readSessionId(req);

        if (req.method === 'DELETE') {
            if (!sessionId) {
                this.reject(res, 400, 'Bad Request: No session ID provided');
                return;
            }
            const session = this.sessions.get(sessionId);
            if (!session) {
                this.reject(res, 404, 'Session not found');
                return;
            }
            await session.transport.handleRequest(req, res);
            return;
        }

        if (req.method === 'GET') {
            if (!sessionId) {
                this.reject(res, 400, 'Bad Request: No session ID provided');
                return;
            }
            const session = this.sessions.get(sessionId);
            if (!session) {
                this.reject(res, 404, 'Session not found');
                return;
            }
            await session.transport.handleRequest(req, res);
            return;
        }

        if (req.method !== 'POST') {
            this.reject(res, 405, 'Method Not Allowed');
            return;
        }

        if (sessionId) {
            const session = this.sessions.get(sessionId);
            if (!session) {
                this.reject(res, 404, 'Session not found');
                return;
            }
            await session.transport.handleRequest(req, res, body);
            return;
        }

        if (!isInitializeRequest(body)) {
            this.reject(res, 400, 'Bad Request: No valid session ID provided');
            return;
        }

        await this.initialize(req, res, body);
    }

    /**
     * Closes every open session. The map is cleared first so any `onclose`
     * callback fired by the closes below finds nothing left to remove.
     * Every unique transport and server is closed independently via
     * `Promise.allSettled` so one failure never stops the rest from closing;
     * every failure is collected into a single thrown `AggregateError`.
     */
    async closeAll(): Promise<void> {
        const active = [...new Set(this.sessions.values())];
        this.sessions.clear();

        const closers: Array<() => Promise<void>> = active.flatMap((session) => [
            () => session.transport.close(),
            () => session.server.close(),
        ]);

        const results = await Promise.allSettled(closers.map((close) => close()));
        const failures = results
            .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
            .map((result) => result.reason);
        if (failures.length > 0) {
            throw new AggregateError(failures, 'Failed to close MCP HTTP sessions');
        }
    }

    private async initialize(
        req: IncomingMessage,
        res: ServerResponse,
        body: unknown,
    ): Promise<void> {
        const server = this.serverFactory();
        const transport = new NodeStreamableHTTPServerTransport({
            sessionIdGenerator: randomUUID,
            onsessioninitialized: (sessionId) => {
                this.sessions.set(sessionId, { transport, server });
            },
        });
        transport.onclose = () => {
            const sessionId = transport.sessionId;
            if (sessionId) {
                this.sessions.delete(sessionId);
            }
            server.close().catch(() => undefined);
        };

        try {
            await server.connect(transport);
            await transport.handleRequest(req, res, body);
        } catch (error) {
            const sessionId = transport.sessionId;
            if (sessionId) {
                this.sessions.delete(sessionId);
            }
            await transport.close().catch(() => undefined);
            await server.close().catch(() => undefined);
            throw error;
        }
    }

    private readSessionId(req: IncomingMessage): string | undefined {
        const value = req.headers['mcp-session-id'];
        return typeof value === 'string' && value.length > 0 ? value : undefined;
    }

    /**
     * Never includes the session ID: only a fixed message and status are
     * written to the response or logged by callers of this class.
     */
    private reject(res: ServerResponse, status: number, message: string): void {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32000, message },
            id: null,
        }));
    }
}
