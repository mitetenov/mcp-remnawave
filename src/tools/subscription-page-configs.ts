import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerSubPageConfigTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('sub_page_configs_list', {
        description: 'List all subscription page configurations',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getSubscriptionPageConfigs()); } catch (e) { return toolError(e); }
    });

    server.registerTool('sub_page_configs_get', {
        description: 'Get a subscription page config by UUID',
        inputSchema: z.object({
            uuid: z.string().describe('Config UUID'),
        }),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getSubscriptionPageConfig(uuid)); } catch (e) { return toolError(e); }
    });

    server.registerTool('sub_page_configs_create', {
        description: 'Create a subscription page configuration',
        inputSchema: z.object({
            name: z.string().describe('Config name'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createSubscriptionPageConfig(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('sub_page_configs_update', {
        description: 'Update a subscription page configuration',
        inputSchema: z.object({
            uuid: z.string().describe('Config UUID'),
            name: z.string().optional().describe('New name'),
        }),
    }, async (params) => {
        try { return toolResult(await client.updateSubscriptionPageConfig(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('sub_page_configs_delete', {
        description: 'Delete a subscription page configuration',
        inputSchema: z.object({
            uuid: z.string().describe('Config UUID'),
        }),
    }, async ({ uuid }) => {
        try { await client.deleteSubscriptionPageConfig(uuid); return toolResult({ success: true, message: `Config ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    server.registerTool('sub_page_configs_reorder', {
        description: 'Reorder subscription page configurations',
        inputSchema: z.object({
            items: z.array(z.object({
                viewPosition: z.number().describe('Sort position (0-based)'),
                uuid: z.string().describe('Config UUID'),
            })).describe('Ordered array of { viewPosition, uuid } objects'),
        }),
    }, async (params) => {
        try { return toolResult(await client.reorderSubscriptionPageConfigs(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('sub_page_configs_clone', {
        description: 'Clone a subscription page configuration',
        inputSchema: z.object({
            cloneFromUuid: z.string().describe('Config UUID to clone'),
        }),
    }, async (params) => {
        try { return toolResult(await client.cloneSubscriptionPageConfig(params)); } catch (e) { return toolError(e); }
    });
}
