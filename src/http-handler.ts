import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * The slice of `StreamableHTTPServerTransport` or `HttpSessionManager` this handler needs.
 * Narrowing it keeps the routing testable without standing up a transport.
 */
export interface McpRequestTarget {
    handleRequest(req: IncomingMessage, res: ServerResponse, body?: unknown): Promise<void>;
}

/**
 * Routes plain HTTP onto the MCP transport target.
 *
 * POST plus DELETE session termination; GET is reserved for `/health`.
 *
 * `GET /health` is the one non-MCP route: container orchestrators need a
 * liveness probe, and the MCP endpoint itself only speaks POST and DELETE, so a health
 * check aimed at it would read every healthy server as broken.
 */
export function createHttpHandler(target: McpRequestTarget) {
    return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
            return;
        }

        const isEndpoint = req.url === '/' || req.url === '';
        const isSupportedMethod = req.method === 'POST' || req.method === 'DELETE';
        if (!isEndpoint || !isSupportedMethod) {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
            return;
        }

        try {
            let parsedBody: unknown;
            if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                    chunks.push(chunk as Buffer);
                }
                const body = Buffer.concat(chunks).toString('utf-8');
                parsedBody = body ? JSON.parse(body) : undefined;
            }
            await target.handleRequest(req, res, parsedBody);
        } catch (error) {
            console.error('MCP request handler error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        }
    };
}
