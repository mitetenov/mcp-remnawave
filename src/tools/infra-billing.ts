import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerInfraBillingTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('billing_providers_list', {
        description: 'List all infrastructure billing providers',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getBillingProviders()); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_provider_get', {
        description: 'Get a billing provider by UUID',
        inputSchema: z.object({
            uuid: z.string().describe('Provider UUID'),
        }),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getBillingProviderByUuid(uuid)); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_nodes_list', {
        description: 'List all billing nodes',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getBillingNodes()); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_history_list', {
        description: 'List billing history',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getBillingHistory()); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_provider_create', {
        description: 'Create a new billing provider',
        inputSchema: z.object({
            name: z.string().describe('Provider name'),
            faviconLink: z.string().optional().describe('Favicon URL'),
            loginUrl: z.string().optional().describe('Login page URL'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createBillingProvider(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_provider_update', {
        description: 'Update a billing provider',
        inputSchema: z.object({
            uuid: z.string().describe('Provider UUID'),
            name: z.string().optional().describe('New name'),
            faviconLink: z.string().optional().describe('New favicon URL'),
            loginUrl: z.string().optional().describe('New login page URL'),
        }),
    }, async (params) => {
        try { return toolResult(await client.updateBillingProvider(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_provider_delete', {
        description: 'Delete a billing provider',
        inputSchema: z.object({
            uuid: z.string().describe('Provider UUID'),
        }),
    }, async ({ uuid }) => {
        try { await client.deleteBillingProvider(uuid); return toolResult({ success: true, message: `Provider ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_node_create', {
        description: 'Create a billing node',
        inputSchema: z.object({
            nodeUuid: z.string().describe('Node UUID'),
            providerUuid: z.string().describe('Provider UUID'),
            name: z.string().nullish().describe('Billing node name'),
            nextBillingAt: z.string().optional().describe('Next billing date (ISO 8601)'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createBillingNode({
            nodeUuid: params.nodeUuid ?? null,
            providerUuid: params.providerUuid,
            name: params.name ?? null,
            nextBillingAt: new Date(params.nextBillingAt ?? Date.now()),
        })); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_node_update', {
        description: 'Update a billing node',
        inputSchema: z.object({
            uuids: z.array(z.string()).describe('Array of billing node UUIDs'),
            nextBillingAt: z.string().describe('New next billing date (ISO 8601)'),
        }),
    }, async (params) => {
        try { return toolResult(await client.updateBillingNode({
            uuids: params.uuids,
            nextBillingAt: new Date(params.nextBillingAt),
        })); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_node_delete', {
        description: 'Delete a billing node',
        inputSchema: z.object({
            uuid: z.string().describe('Billing node UUID'),
        }),
    }, async ({ uuid }) => {
        try { await client.deleteBillingNode(uuid); return toolResult({ success: true, message: `Billing node ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_history_create', {
        description: 'Create a billing history entry',
        inputSchema: z.object({
            providerUuid: z.string().describe('Provider UUID'),
            amount: z.number().describe('Amount'),
            billedAt: z.string().describe('Billing date (ISO 8601)'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createBillingHistory({
            providerUuid: params.providerUuid,
            amount: params.amount,
            billedAt: new Date(params.billedAt),
        })); } catch (e) { return toolError(e); }
    });

    server.registerTool('billing_history_delete', {
        description: 'Delete a billing history entry',
        inputSchema: z.object({
            uuid: z.string().describe('History entry UUID'),
        }),
    }, async ({ uuid }) => {
        try { await client.deleteBillingHistory(uuid); return toolResult({ success: true, message: `History entry ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });
}
