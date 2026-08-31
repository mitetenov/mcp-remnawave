import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerSubscriptionTools(
    server: McpServer,
    client: RemnawaveClient,
) {
    server.registerTool(
        'subscriptions_list',
        {
            description: 'List all subscriptions with pagination',
            inputSchema: z.object({
                start: z.number().default(0).describe('Offset for pagination'),
                size: z.number().default(25).describe('Number of subscriptions'),
            }),
        },
        async ({ start, size }) => {
            try {
                const result = await client.getSubscriptions(start, size);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'subscriptions_get_by_user_id',
        {
            description: 'Get subscription details by user ID',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result = await client.getSubscriptionByUserId(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'subscriptions_get_by_username',
        {
            description: 'Get subscription details by username',
            inputSchema: z.object({
                username: z.string().describe('Username'),
            }),
        },
        async ({ username }) => {
            try {
                const result =
                    await client.getSubscriptionByUsername(username);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'subscriptions_get_by_short_uuid',
        {
            description: 'Get subscription details by short UUID',
            inputSchema: z.object({
                shortUuid: z.string().describe('Short UUID'),
            }),
        },
        async ({ shortUuid }) => {
            try {
                const result =
                    await client.getSubscriptionByShortUuid(shortUuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'subscription_info',
        {
            description: 'Get subscription info by short UUID (public endpoint)',
            inputSchema: z.object({
                shortUuid: z.string().describe('Short UUID'),
            }),
        },
        async ({ shortUuid }) => {
            try {
                const result =
                    await client.getSubscriptionInfo(shortUuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'subscriptions_get_raw_by_short_uuid',
        {
            description: 'Get raw subscription config by short UUID',
            inputSchema: z.object({ shortUuid: z.string().describe('Short UUID') }),
        },
        async ({ shortUuid }) => {
            try { return toolResult(await client.getSubscriptionByShortUuidRaw(shortUuid)); } catch (e) { return toolError(e); }
        },
    );

    server.registerTool(
        'subscriptions_get_subpage_config',
        {
            description: 'Get subscription page configuration',
            inputSchema: z.object({ shortUuid: z.string().describe('Short UUID') }),
        },
        async ({ shortUuid }) => {
            try { return toolResult(await client.getSubscriptionSubpageConfig(shortUuid)); } catch (e) { return toolError(e); }
        },
    );

    server.registerTool(
        'subscriptions_get_connection_keys',
        {
            description: 'Get connection keys for a subscription',
            inputSchema: z.object({ userId: z.number().describe('User ID') }),
        },
        async ({ userId }) => {
            try { return toolResult(await client.getConnectionKeysByUserId(userId)); } catch (e) { return toolError(e); }
        },
    );

    server.registerTool(
        'subscription_request_history_list',
        {
            description: 'List subscription request history',
            inputSchema: z.object({}),
        },
        async () => {
            try { return toolResult(await client.getSubscriptionRequestHistory()); } catch (e) { return toolError(e); }
        },
    );

    server.registerTool(
        'subscription_request_history_stats',
        {
            description: 'Get subscription request history statistics',
            inputSchema: z.object({}),
        },
        async () => {
            try { return toolResult(await client.getSubscriptionRequestHistoryStats()); } catch (e) { return toolError(e); }
        },
    );
}
