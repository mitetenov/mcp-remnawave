import http from 'node:http';
import { createHttpHandler } from './http-handler.js';
import { HttpSessionManager } from './http-session-manager.js';
import { loadConfig } from './config.js';
import { createServer } from './server.js';

const PORT = parseInt(process.env.MCP_HTTP_PORT ?? '3100', 10);
const HOST = process.env.MCP_HTTP_HOST ?? '0.0.0.0';

const config = loadConfig();
const sessions = new HttpSessionManager(() => createServer(config));
const httpServer = http.createServer(createHttpHandler(sessions));

httpServer.listen(PORT, HOST, () => {
    console.log(`MCP Remnawave HTTP server listening on http://${HOST}:${PORT}`);
});

let shuttingDown = false;
const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('Shutting down MCP HTTP server...');
    await new Promise<void>((resolve, reject) =>
        httpServer.close((error) => (error ? reject(error) : resolve())),
    );
    await sessions.closeAll();
};

const handleSignal = () => {
    void shutdown().catch((error) => {
        console.error('MCP HTTP shutdown failed:', error);
        process.exitCode = 1;
    });
};

process.on('SIGTERM', handleSignal);
process.on('SIGINT', handleSignal);
