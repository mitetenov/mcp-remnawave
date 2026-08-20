import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * The slice of `StreamableHTTPServerTransport` this handler needs. Narrowing it
 * keeps the routing testable without standing up a transport.
 */
export interface McpRequestTarget {
    handleRequest(req: IncomingMessage, res: ServerResponse, body?: unknown): Promise<void>;
}

/**
 * Routes plain HTTP onto the MCP transport.
 *
 * `GET /health` is the one non-MCP route: container orchestrators need a
 * liveness probe, and the MCP endpoint itself only speaks POST, so a health
 * check aimed at it would read every healthy server as broken.
 */
export function createHttpHandler(transport: McpRequestTarget) {
    return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
            return;
        }

        // Everything else is the MCP endpoint, which is POST-only.
        if (req.method !== 'POST' || (req.url !== '/' && req.url !== '')) {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
            return;
        }

        try {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
                chunks.push(chunk as Buffer);
            }
            const body = Buffer.concat(chunks).toString('utf-8');
            const parsedBody = body ? JSON.parse(body) : undefined;
            await transport.handleRequest(req, res, parsedBody);
        } catch (err) {
            console.error('MCP request handler error:', err);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        }
    };
}
