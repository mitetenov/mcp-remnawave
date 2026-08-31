import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerSquadTools(
    server: McpServer,
    client: RemnawaveClient,
) {
    server.registerTool(
        'squads_list',
        {
            description: 'List all internal squads',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getInternalSquads();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'squads_accessible_nodes',
        {
            description: 'Get nodes accessible to a specific squad',
            inputSchema: z.object({
                uuid: z.string().describe('Squad UUID'),
            }),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getSquadAccessibleNodes(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'squads_create',
        {
            description: 'Create a new internal squad',
            inputSchema: z.object({
                name: z.string().describe('Squad name'),
                inbounds: z.array(z.string()).describe('Array of inbound UUIDs'),
            }),
        },
        async (params) => {
            try {
                const result = await client.createInternalSquad(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'squads_update',
        {
            description: 'Update an internal squad',
            inputSchema: z.object({
                uuid: z.string().describe('Squad UUID'),
                name: z.string().optional().describe('New squad name'),
            }),
        },
        async (params) => {
            try {
                const result = await client.updateInternalSquad(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'squads_delete',
        {
            description: 'Delete an internal squad',
            inputSchema: z.object({
                uuid: z.string().describe('Squad UUID to delete'),
            }),
        },
        async ({ uuid }) => {
            try {
                await client.deleteInternalSquad(uuid);
                return toolResult({
                    success: true,
                    message: `Squad ${uuid} deleted`,
                });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'squads_add_users',
        {
            description: 'Add specific users to an internal squad',
            inputSchema: z.object({
                squadUuid: z.string().describe('Squad UUID'),
                userIds: z
                    .array(z.number())
                    .describe('Array of user IDs to add (max 1000)'),
            }),
        },
        async ({ squadUuid, userIds }) => {
            try {
                const result = await client.addManyUsersToSquad(squadUuid, {
                    userIds,
                });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'squads_remove_users',
        {
            description: 'Remove specific users from an internal squad',
            inputSchema: z.object({
                squadUuid: z.string().describe('Squad UUID'),
                userIds: z
                    .array(z.number())
                    .describe('Array of user IDs to remove (max 1000)'),
            }),
        },
        async ({ squadUuid, userIds }) => {
            try {
                const result = await client.removeManyUsersFromSquad(squadUuid, {
                    userIds,
                });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'squads_add_all_users',
        {
            description: 'Add EVERY user on the panel to an internal squad',
            inputSchema: z.object({
                squadUuid: z.string().describe('Squad UUID'),
            }),
        },
        async ({ squadUuid }) => {
            try {
                const result = await client.addAllUsersToSquad(squadUuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'squads_remove_all_users',
        {
            description: 'Remove EVERY user from an internal squad',
            inputSchema: z.object({
                squadUuid: z.string().describe('Squad UUID'),
            }),
        },
        async ({ squadUuid }) => {
            try {
                const result = await client.removeAllUsersFromSquad(squadUuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
