import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { loadConfig } from './config.js';
import { createServer } from './server.js';

const config = loadConfig();
await serveStdio(() => createServer(config));
