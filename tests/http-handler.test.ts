import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHttpHandler } from '../src/http-handler.js';

function request(method: string, url: string, body = ''): IncomingMessage {
    const stream = Readable.from(body ? [Buffer.from(body)] : []);
    return Object.assign(stream, { method, url }) as unknown as IncomingMessage;
}

function response() {
    const sent: { status?: number; body?: string } = {};
    const res = {
        headersSent: false,
        writeHead(status: number) {
            sent.status = status;
            this.headersSent = true;
            return this;
        },
        end(chunk?: string) {
            sent.body = chunk;
        },
    };
    return { res: res as unknown as ServerResponse, sent };
}

function transportSpy() {
    const calls: Array<{ method?: string; body?: unknown }> = [];
    return {
        calls,
        transport: {
            async handleRequest(req: IncomingMessage, _res: ServerResponse, body?: unknown) {
                calls.push({ method: req.method, body });
            },
        },
    };
}

describe('createHttpHandler', () => {
    it('answers GET /health with 200 so a container health check can reach it', async () => {
        const { transport } = transportSpy();
        const { res, sent } = response();

        await createHttpHandler(transport)(request('GET', '/health'), res);

        expect(sent.status).toBe(200);
    });

    it('still rejects GET on the MCP endpoint', async () => {
        const { transport } = transportSpy();
        const { res, sent } = response();

        await createHttpHandler(transport)(request('GET', '/'), res);

        expect(sent.status).toBe(405);
    });

    it('hands a POST body to the transport parsed', async () => {
        const { transport, calls } = transportSpy();
        const { res } = response();

        await createHttpHandler(transport)(
            request('POST', '/', '{"jsonrpc":"2.0","method":"tools/list","id":1}'),
            res,
        );

        expect(calls).toEqual([{
            method: 'POST',
            body: { jsonrpc: '2.0', method: 'tools/list', id: 1 },
        }]);
    });

    it('hands DELETE on the MCP endpoint to the session target without parsing a body', async () => {
        const { transport, calls } = transportSpy();
        const { res } = response();

        await createHttpHandler(transport)(request('DELETE', '/'), res);

        expect(calls).toEqual([{ method: 'DELETE', body: undefined }]);
    });
});
