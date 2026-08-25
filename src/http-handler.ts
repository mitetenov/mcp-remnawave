import type { IncomingMessage, ServerResponse } from 'node:http';
import {
    hostHeaderValidationResponse,
    isJsonContentType,
    isLegacyRequest,
    localhostAllowedHostnames,
    localhostAllowedOrigins,
    originValidationResponse,
} from '@modelcontextprotocol/server';
import { toWebRequest, type NodeMcpRequestHandler } from '@modelcontextprotocol/node';

/**
 * The slice of `HttpSessionManager` this handler needs for the 2025-era
 * (legacy) leg. Narrowing it keeps the routing testable without standing up
 * a real transport.
 */
export interface McpRequestTarget {
    handleRequest(req: IncomingMessage, res: ServerResponse, body?: unknown): Promise<void>;
}

/**
 * The Docker Compose service name this server may be reached at internally,
 * in addition to the loopback addresses the SDK's own helpers allow.
 */
const DOCKER_SERVICE_HOSTNAME = 'mcp-remnawave';

const ALLOWED_HOSTNAMES = [...localhostAllowedHostnames(), DOCKER_SERVICE_HOSTNAME];
const ALLOWED_ORIGIN_HOSTNAMES = [...localhostAllowedOrigins(), DOCKER_SERVICE_HOSTNAME];

export interface DualEraTargets {
    /** Owns every 2025-era (sessionful) exchange: handshake, GET stream, DELETE. */
    legacy: McpRequestTarget;
    /** The Node-adapted `createMcpHandler` face serving stateless 2026-07-28 traffic. */
    modern: NodeMcpRequestHandler;
}

/**
 * Routes plain HTTP onto the two protocol eras.
 *
 * `GET /health` is the one non-MCP route: container orchestrators need a
 * liveness probe, and the MCP endpoint itself only speaks POST, GET (SSE
 * stream resume) and DELETE (session close), so a health check aimed at it
 * would read every healthy server as broken.
 *
 * Every other request to `/` is converted to a web-standard `Request` once,
 * checked against the Host/Origin allowlist, classified with
 * `isLegacyRequest`, and handed to whichever leg owns that era. The legacy
 * manager is the sole owner of sessionful handshake traffic; the modern leg
 * never sees a session ID and never issues one.
 */
export function createHttpHandler({ legacy, modern }: DualEraTargets) {
    return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
            return;
        }

        const isEndpoint = req.url === '/' || req.url === '';
        const isSupportedMethod = req.method === 'POST' || req.method === 'GET' || req.method === 'DELETE';
        if (!isEndpoint || !isSupportedMethod) {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
            return;
        }

        try {
            const request = await toWebRequest(req);

            const rejected =
                hostHeaderValidationResponse(request, ALLOWED_HOSTNAMES) ??
                originValidationResponse(request, ALLOWED_ORIGIN_HOSTNAMES);
            if (rejected) {
                await writeWebResponse(res, rejected);
                return;
            }

            const legacyRequest = await isLegacyRequest(request);

            let parsedBody: unknown;
            if (req.method === 'POST') {
                if (!isJsonContentType(request.headers.get('content-type'))) {
                    writeJsonRpcError(res, 415, 'Unsupported Media Type: Content-Type must be application/json');
                    return;
                }
                const text = await request.text();
                if (text.length > 0) {
                    try {
                        parsedBody = JSON.parse(text);
                    } catch {
                        // Malformed JSON always classifies as a legacy request (see
                        // isLegacyRequest's contract); leave parsedBody undefined and
                        // let the legacy manager's own missing/invalid-body handling
                        // answer with a 4xx instead of throwing here.
                        parsedBody = undefined;
                    }
                }
            }

            if (legacyRequest) {
                await legacy.handleRequest(req, res, parsedBody);
            } else {
                await modern(req, res, parsedBody);
            }
        } catch (error) {
            console.error('MCP request handler error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        }
    };
}

async function writeWebResponse(res: ServerResponse, response: Response): Promise<void> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
        headers[key] = value;
    });
    res.writeHead(response.status, headers);
    const body = await response.text();
    res.end(body);
}

function writeJsonRpcError(res: ServerResponse, status: number, message: string): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message },
        id: null,
    }));
}
