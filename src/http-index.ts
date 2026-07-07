import http from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadConfig } from './config.js';
import { createServer } from './server.js';

const PORT = parseInt(process.env.MCP_HTTP_PORT ?? '3100', 10);
const HOST = process.env.MCP_HTTP_HOST ?? '0.0.0.0';

const config = loadConfig();
const mcpServer = createServer(config);

const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
});

const httpServer = http.createServer(async (req, res) => {
    // Only handle POST requests to the root endpoint
    if (req.method !== 'POST' || (req.url !== '/' && req.url !== '')) {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        return;
    }

    try {
        // Collect the request body
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
});

// Connect the MCP server to the HTTP transport
await mcpServer.connect(transport);

httpServer.listen(PORT, HOST, () => {
    console.log(`MCP Remnawave HTTP server listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down MCP HTTP server...');
    httpServer.close();
    await transport.close();
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
