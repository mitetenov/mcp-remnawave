import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { McpServer } from '@modelcontextprotocol/server';
import { isInitializeRequest } from '@modelcontextprotocol/server';
import { NodeStreamableHTTPServerTransport as StreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import type { McpRequestTarget } from './http-handler.js';

type ServerFactory = () => McpServer;

export class HttpSessionManager implements McpRequestTarget {
    private readonly transports = new Map<string, StreamableHTTPServerTransport>();

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
            const transport = this.transports.get(sessionId);
            if (!transport) {
                this.reject(res, 404, 'Session not found');
                return;
            }
            await transport.handleRequest(req, res);
            return;
        }

        if (req.method !== 'POST') {
            this.reject(res, 405, 'Method Not Allowed');
            return;
        }

        if (sessionId) {
            const transport = this.transports.get(sessionId);
            if (!transport) {
                this.reject(res, 404, 'Session not found');
                return;
            }
            await transport.handleRequest(req, res, body);
            return;
        }

        if (!isInitializeRequest(body)) {
            this.reject(res, 400, 'Bad Request: No valid session ID provided');
            return;
        }

        await this.initialize(req, res, body);
    }

    async closeAll(): Promise<void> {
        const active = [...new Set(this.transports.values())];
        this.transports.clear();
        const results = await Promise.allSettled(active.map((transport) => transport.close()));
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
        let transport!: StreamableHTTPServerTransport;
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: randomUUID,
            onsessioninitialized: (sessionId) => {
                this.transports.set(sessionId, transport);
            },
        });
        transport.onclose = () => {
            const sessionId = transport.sessionId;
            if (sessionId) {
                this.transports.delete(sessionId);
            }
        };

        const server = this.serverFactory();
        try {
            await server.connect(transport);
            await transport.handleRequest(req, res, body);
        } catch (error) {
            const sessionId = transport.sessionId;
            if (sessionId) {
                this.transports.delete(sessionId);
            }
            await transport.close().catch(() => undefined);
            throw error;
        }
    }

    private readSessionId(req: IncomingMessage): string | undefined {
        const value = req.headers['mcp-session-id'];
        return typeof value === 'string' && value.length > 0 ? value : undefined;
    }

    private reject(res: ServerResponse, status: number, message: string): void {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32000, message },
            id: null,
        }));
    }
}
