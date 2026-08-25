import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { CreateUserCommand, UpdateUserCommand } from '@remnawave/backend-contract';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerUserTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool(
        'users_list',
        {
            description: 'List all Remnawave VPN users with pagination',
            inputSchema: z.object({
                start: z.number().default(0).describe('Offset for pagination'),
                size: z.number().default(25).describe('Number of users to return'),
            }),
        },
        async ({ start, size }) => {
            try {
                const result = await client.getUsers(start, size);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_get',
        {
            description: 'Get a specific Remnawave user by their numeric ID',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result = await client.getUserById(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_get_by_username',
        {
            description: 'Get a Remnawave user by their username',
            inputSchema: z.object({
                username: z.string().describe('Username'),
            }),
        },
        async ({ username }) => {
            try {
                const result = await client.getUserByUsername(username);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_get_by_short_uuid',
        {
            description: 'Get a Remnawave user by their short UUID',
            inputSchema: z.object({
                shortUuid: z.string().describe('Short UUID'),
            }),
        },
        async ({ shortUuid }) => {
            try {
                const result = await client.getUserByShortUuid(shortUuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_get_by_telegram_id',
        {
            description: 'Get Remnawave users by their Telegram ID. Returns a list — one Telegram ID may own several accounts.',
            inputSchema: z.object({
                telegramId: z.number().describe('Telegram user ID'),
                size: z.number().optional().describe('Max users to return (default 25)'),
            }),
        },
        async ({ telegramId, size }) => {
            try {
                const result = await client.getUsersByTelegramId(telegramId, size);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_accessible_nodes',
        {
            description: 'List nodes a Remnawave user can connect to',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result = await client.getUserAccessibleNodes(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_tags_list',
        {
            description: 'List all user tags',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getUserTags();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_resolve',
        {
            description: 'Search and resolve a user by ID, short UUID, or username. Exactly one of the fields must be provided.',
            inputSchema: z.object({
                id: z.number().optional().describe('User numeric ID'),
                shortUuid: z.string().optional().describe('Short UUID'),
                username: z.string().optional().describe('Username'),
            }),
        },
        async (params) => {
            try {
                const result = await client.resolveUsers(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_create',
        {
            description: 'Create a new VPN user in Remnawave',
            inputSchema: z.object({
                username: z.string().describe('Unique username'),
                expireAt: z.string().describe('Expiration date in ISO 8601 format'),
                trafficLimitBytes: z
                    .number()
                    .optional()
                    .describe('Traffic limit in bytes (0 = unlimited)'),
                trafficLimitStrategy: z
                    .enum(['NO_RESET', 'DAY', 'WEEK', 'MONTH', 'MONTH_ROLLING'])
                    .optional()
                    .describe('Traffic reset period'),
                status: z
                    .enum(['ACTIVE', 'DISABLED'])
                    .optional()
                    .describe('Initial user status'),
                description: z.string().optional().describe('User description'),
                tag: z.string().optional().describe('User tag for grouping'),
                telegramId: z.number().optional().describe('Telegram user ID'),
                email: z.string().optional().describe('User email'),
                hwidDeviceLimit: z
                    .number()
                    .optional()
                    .describe('Max number of HWID devices'),
                activeInternalSquads: z
                    .array(z.string())
                    .optional()
                    .describe('Array of internal squad UUIDs'),
                shortUuid: z.string().optional().describe('Custom short UUID for the user'),
                externalSquadUuid: z.string().optional().describe('External squad UUID'),
            }),
        },
        async (params) => {
            try {
                const result = await client.createUser({
                    ...params,
                    expireAt: new Date(params.expireAt),
                } as CreateUserCommand.RequestBody);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_update',
        {
            description: 'Update an existing Remnawave user. Identify the user by id or username.',
            inputSchema: z.object({
                id: z.number().optional().describe('User ID to update'),
                username: z
                    .string()
                    .optional()
                    .describe('Username of the user to update (alternative to id)'),
                expireAt: z
                    .string()
                    .optional()
                    .describe('New expiration date (ISO 8601)'),
                trafficLimitBytes: z
                    .number()
                    .optional()
                    .describe('New traffic limit in bytes'),
                trafficLimitStrategy: z
                    .enum(['NO_RESET', 'DAY', 'WEEK', 'MONTH', 'MONTH_ROLLING'])
                    .optional()
                    .describe('Traffic reset period'),
                status: z
                    .enum(['ACTIVE', 'DISABLED'])
                    .optional()
                    .describe('User status'),
                description: z.string().optional().describe('User description'),
                tag: z.string().optional().describe('User tag'),
                telegramId: z.number().optional().describe('Telegram user ID'),
                email: z.string().optional().describe('User email'),
                hwidDeviceLimit: z
                    .number()
                    .optional()
                    .describe('Max HWID devices'),
                activeInternalSquads: z
                    .array(z.string())
                    .optional()
                    .describe('Internal squad UUIDs'),
                externalSquadUuid: z.string().optional().describe('External squad UUID'),
            }),
        },
        async (params) => {
            try {
                const result = await client.updateUser({
                    ...params,
                    expireAt: params.expireAt ? new Date(params.expireAt) : undefined,
                } as UpdateUserCommand.RequestBody);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_delete',
        {
            description: 'Permanently delete a Remnawave user',
            inputSchema: z.object({
                userId: z.number().describe('User ID to delete'),
            }),
        },
        async ({ userId }) => {
            try {
                await client.deleteUser(userId);
                return toolResult({ success: true, message: `User ${userId} deleted` });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_enable',
        {
            description: 'Enable a disabled Remnawave user (restore VPN access)',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result = await client.enableUser(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_disable',
        {
            description: 'Disable a Remnawave user (block VPN access)',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result = await client.disableUser(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_revoke_subscription',
        {
            description: 'Revoke subscription for a Remnawave user (generates new subscription link)',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result = await client.revokeUserSubscription(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_reset_traffic',
        {
            description: 'Reset traffic counter for a Remnawave user',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result = await client.resetUserTraffic(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_extend_expiration',
        {
            description: 'Extend expiration date for a single Remnawave user. An EXPIRED user is extended from today and becomes ACTIVE.',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
                days: z.number().describe('Number of days to extend'),
            }),
        },
        async ({ userId, days }) => {
            try {
                const result = await client.extendUser(userId, { days });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_delete_by_status',
        {
            description: 'Bulk delete users by status',
            inputSchema: z.object({
                status: z.enum(['ACTIVE', 'DISABLED', 'LIMITED', 'EXPIRED']).describe('User status to delete'),
            }),
        },
        async (params) => {
            try {
                const result = await client.bulkDeleteUsersByStatus(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_update',
        {
            description: 'Bulk update selected users',
            inputSchema: z.object({
                userIds: z.array(z.number()).describe('Array of user IDs to update'),
                status: z.enum(['ACTIVE', 'DISABLED', 'LIMITED', 'EXPIRED']).optional().describe('New status'),
                expireAt: z.string().optional().describe('New expiration date (ISO 8601)'),
                trafficLimitBytes: z.number().optional().describe('New traffic limit'),
                trafficLimitStrategy: z.enum(['NO_RESET', 'DAY', 'WEEK', 'MONTH', 'MONTH_ROLLING']).optional().describe('Traffic reset period'),
                description: z.string().optional().describe('User description'),
                telegramId: z.number().optional().describe('Telegram user ID'),
                email: z.string().optional().describe('User email'),
                tag: z.string().optional().describe('User tag'),
                hwidDeviceLimit: z.number().optional().describe('Max HWID devices'),
                externalSquadUuid: z.string().optional().describe('External squad UUID'),
            }),
        },
        async (params) => {
            try {
                const { userIds, ...fields } = params;
                const result = await client.bulkUpdateUsers({
                    userIds,
                    fields: {
                        ...fields,
                        expireAt: fields.expireAt ? new Date(fields.expireAt) : undefined,
                    },
                });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_reset_traffic',
        {
            description: 'Bulk reset traffic for selected users',
            inputSchema: z.object({
                userIds: z.array(z.number()).describe('Array of user IDs'),
            }),
        },
        async (params) => {
            try {
                const result = await client.bulkResetUsersTraffic(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_revoke_subscription',
        {
            description: 'Bulk revoke subscriptions for selected users',
            inputSchema: z.object({
                userIds: z.array(z.number()).describe('Array of user IDs'),
            }),
        },
        async (params) => {
            try {
                const result = await client.bulkRevokeUsersSubscription(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_delete',
        {
            description: 'Bulk delete selected users',
            inputSchema: z.object({
                userIds: z.array(z.number()).describe('Array of user IDs to delete'),
            }),
        },
        async (params) => {
            try {
                const result = await client.bulkDeleteUsers(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_update_squads',
        {
            description: 'Bulk update squad assignments for selected users',
            inputSchema: z.object({
                userIds: z.array(z.number()).describe('Array of user IDs'),
                activeInternalSquads: z.array(z.string()).describe('Squad UUIDs to assign'),
            }),
        },
        async (params) => {
            try {
                const result = await client.bulkUpdateUserSquads(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_extend_expiration',
        {
            description: 'Bulk extend expiration date for selected users',
            inputSchema: z.object({
                userIds: z.array(z.number()).describe('Array of user IDs'),
                extendDays: z.number().describe('Number of days to extend'),
            }),
        },
        async (params) => {
            try {
                const result = await client.bulkExtendUsersExpiration(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_all_update',
        {
            description: 'Update ALL users at once',
            inputSchema: z.object({
                status: z.enum(['ACTIVE', 'DISABLED', 'LIMITED', 'EXPIRED']).optional().describe('New status for all'),
                expireAt: z.string().optional().describe('New expiration date for all'),
                trafficLimitBytes: z.number().optional().describe('Traffic limit in bytes'),
                trafficLimitStrategy: z.enum(['NO_RESET', 'DAY', 'WEEK', 'MONTH', 'MONTH_ROLLING']).optional().describe('Traffic reset period'),
                description: z.string().optional().describe('User description'),
                telegramId: z.number().optional().describe('Telegram user ID'),
                email: z.string().optional().describe('User email'),
                tag: z.string().optional().describe('User tag'),
                hwidDeviceLimit: z.number().optional().describe('Max HWID devices'),
            }),
        },
        async (params) => {
            try {
                const result = await client.bulkAllUpdateUsers({
                    ...params,
                    expireAt: params.expireAt ? new Date(params.expireAt) : undefined,
                });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_all_reset_traffic',
        {
            description: 'Reset traffic counters for ALL users',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.bulkAllResetUsersTraffic();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'users_bulk_all_extend_expiration',
        {
            description: 'Extend expiration date for ALL users',
            inputSchema: z.object({
                extendDays: z.number().describe('Number of days to extend'),
            }),
        },
        async (params) => {
            try {
                const result = await client.bulkAllExtendUsersExpiration(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
