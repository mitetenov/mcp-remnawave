import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerKeygenTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('keygen_get', {
        description: 'Generate a new SECRET_KEY for node configuration',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getKeygen()); } catch (e) { return toolError(e); }
    });
}
