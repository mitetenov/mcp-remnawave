import { McpServer } from '@modelcontextprotocol/server';
import { RemnawaveClient } from './client/index.js';
import { Config } from './config.js';
import { registerAllTools } from './tools/index.js';
import { registerAllResources } from './resources/index.js';
import { registerAllPrompts } from './prompts/index.js';
import { restrictToSupport } from './support-filter.js';

export function createServer(config: Config): McpServer {
    const server = new McpServer({
        name: 'remnawave-mcp',
        version: '3.3.0',
    });

    const client = new RemnawaveClient(config);
    // Registration goes through the gate; the caller still connects the real
    // server instance.
    const target = config.isSupport ? restrictToSupport(server) : server;

    registerAllTools(target, client);
    registerAllResources(target, client);
    registerAllPrompts(target);

    return server;
}
