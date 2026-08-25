import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerSettingsTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('settings_get', {
        description: 'Get Remnawave panel settings',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getSettings()); } catch (e) { return toolError(e); }
    });

    server.registerTool('settings_update', {
        description: 'Update Remnawave panel settings',
        inputSchema: z.object({
            settings: z.object({}).catchall(z.unknown()).describe('Settings key-value pairs to update'),
        }),
    }, async ({ settings }) => {
        try { return toolResult(await client.updateSettings(settings)); } catch (e) { return toolError(e); }
    });
}
