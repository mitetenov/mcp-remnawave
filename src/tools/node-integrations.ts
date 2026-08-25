import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerNodeIntegrationTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('node_integrations_list', {
        description: 'List all node integrations',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getNodeIntegrations()); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_integrations_get', {
        description: 'Get a node integration by UUID',
        inputSchema: z.object({
            uuid: z.string().describe('Integration UUID'),
        }),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getNodeIntegration(uuid)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_integrations_create', {
        description: 'Create a node integration',
        inputSchema: z.object({
            name: z.string().describe('Integration name (2-30 characters)'),
            description: z.string().optional().describe('Integration description'),
            config: z.object({}).catchall(z.unknown()).describe('Integration config key-value pairs'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createNodeIntegration(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_integrations_update', {
        description: 'Update a node integration',
        inputSchema: z.object({
            uuid: z.string().describe('Integration UUID'),
            name: z.string().optional().describe('New name'),
            description: z.string().optional().describe('New description'),
            config: z.object({}).catchall(z.unknown()).optional().describe('New config key-value pairs'),
            restartNodes: z.boolean().optional().describe('Restart affected nodes after the update'),
        }),
    }, async (params) => {
        try { return toolResult(await client.updateNodeIntegration(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_integrations_delete', {
        description: 'Delete a node integration',
        inputSchema: z.object({
            uuid: z.string().describe('Integration UUID'),
        }),
    }, async ({ uuid }) => {
        try { await client.deleteNodeIntegration(uuid); return toolResult({ success: true, message: `Integration ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });
}
