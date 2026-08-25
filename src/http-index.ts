import http from 'node:http';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createHttpHandler } from './http-handler.js';
import { HttpSessionManager } from './http-session-manager.js';
import { loadConfig } from './config.js';
import { createServer } from './server.js';

const PORT = parseInt(process.env.MCP_HTTP_PORT ?? '3100', 10);
const HOST = process.env.MCP_HTTP_HOST ?? '0.0.0.0';

const config = loadConfig();

// Legacy (2025-era) sessionful traffic: the only owner of handshake state.
const legacy = new HttpSessionManager(() => createServer(config));

// Modern (2026-07-28) stateless traffic: one instance per request, no
// session ID ever issued or accepted. `responseMode: 'json'` is valid
// because none of this server's tools emit mid-call notifications.
const modern = createMcpHandler(() => createServer(config), {
    legacy: 'reject',
    responseMode: 'json',
});
const modernNode = toNodeHandler(modern);

const httpServer = http.createServer(createHttpHandler({ legacy, modern: modernNode }));

httpServer.listen(PORT, HOST, () => {
    console.log(`MCP Remnawave HTTP server listening on http://${HOST}:${PORT}`);
});

let shuttingDown = false;
const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('Shutting down MCP HTTP server...');

    const serverClose = new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
    });

    if (typeof httpServer.closeIdleConnections === 'function') {
        httpServer.closeIdleConnections();
    }

    const results = await Promise.allSettled([
        serverClose,
        modern.close(),
        legacy.closeAll(),
    ]);

    const failures = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason);
    if (failures.length > 0) {
        throw new AggregateError(failures, 'Failed to shut down MCP HTTP server cleanly');
    }
};

const handleSignal = () => {
    void shutdown().catch((error) => {
        console.error('MCP HTTP shutdown failed:', error);
        process.exitCode = 1;
    });
};

process.on('SIGTERM', handleSignal);
process.on('SIGINT', handleSignal);
