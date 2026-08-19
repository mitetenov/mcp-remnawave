import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerNodeIntegrationTools(server: McpServer, client: RemnawaveClient, readonly: boolean) {
    server.tool('node_integrations_list', 'List all node integrations', {}, async () => {
        try { return toolResult(await client.getNodeIntegrations()); } catch (e) { return toolError(e); }
    });

    server.tool('node_integrations_get', 'Get a node integration by UUID', {
        uuid: z.string().describe('Integration UUID'),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getNodeIntegration(uuid)); } catch (e) { return toolError(e); }
    });

    if (readonly) return;

    server.tool('node_integrations_create', 'Create a node integration', {
        name: z.string().describe('Integration name (2-30 characters)'),
        description: z.string().optional().describe('Integration description'),
        config: z.object({}).catchall(z.unknown()).describe('Integration config key-value pairs'),
    }, async (params) => {
        try { return toolResult(await client.createNodeIntegration(params)); } catch (e) { return toolError(e); }
    });

    server.tool('node_integrations_update', 'Update a node integration', {
        uuid: z.string().describe('Integration UUID'),
        name: z.string().optional().describe('New name'),
        description: z.string().optional().describe('New description'),
        config: z.object({}).catchall(z.unknown()).optional().describe('New config key-value pairs'),
        restartNodes: z.boolean().optional().describe('Restart affected nodes after the update'),
    }, async (params) => {
        try { return toolResult(await client.updateNodeIntegration(params)); } catch (e) { return toolError(e); }
    });

    server.tool('node_integrations_delete', 'Delete a node integration', {
        uuid: z.string().describe('Integration UUID'),
    }, async ({ uuid }) => {
        try { await client.deleteNodeIntegration(uuid); return toolResult({ success: true, message: `Integration ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });
}
