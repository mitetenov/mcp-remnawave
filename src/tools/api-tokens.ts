import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerApiTokenTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('api_tokens_list', {
        description: 'List all API tokens',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getApiTokens()); } catch (e) { return toolError(e); }
    });

    server.registerTool('api_tokens_create', {
        description: 'Create a new API token',
        inputSchema: z.object({
            name: z.string().describe('Token name (2-30 characters)'),
            expiresInDays: z.number().describe('Expiration in days'),
            scopes: z.array(z.string()).default(['*']).describe('API token scopes'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createApiToken(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('api_tokens_ott', {
        description: 'Get a short-lived token for the backend tools (Swagger, Scalar, Bull Board)',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getOtt()); } catch (e) { return toolError(e); }
    });

    server.registerTool('api_tokens_delete', {
        description: 'Delete an API token',
        inputSchema: z.object({
            uuid: z.string().describe('Token UUID to delete'),
        }),
    }, async ({ uuid }) => {
        try { await client.deleteApiToken(uuid); return toolResult({ success: true, message: `Token ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });
}
