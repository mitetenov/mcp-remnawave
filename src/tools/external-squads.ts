import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerExternalSquadTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('external_squads_list', {
        description: 'List all external squads',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getExternalSquads()); } catch (e) { return toolError(e); }
    });

    server.registerTool('external_squads_get', {
        description: 'Get an external squad by UUID',
        inputSchema: z.object({
            uuid: z.string().describe('Squad UUID'),
        }),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getExternalSquadByUuid(uuid)); } catch (e) { return toolError(e); }
    });

    server.registerTool('external_squads_create', {
        description: 'Create a new external squad',
        inputSchema: z.object({
            name: z.string().describe('Squad name'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createExternalSquad(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('external_squads_update', {
        description: 'Update an external squad',
        inputSchema: z.object({
            uuid: z.string().describe('Squad UUID'),
            name: z.string().optional().describe('New squad name'),
        }),
    }, async (params) => {
        try { return toolResult(await client.updateExternalSquad(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('external_squads_delete', {
        description: 'Delete an external squad',
        inputSchema: z.object({
            uuid: z.string().describe('Squad UUID'),
        }),
    }, async ({ uuid }) => {
        try { await client.deleteExternalSquad(uuid); return toolResult({ success: true, message: `Squad ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    server.registerTool('external_squads_add_all_users', {
        description: 'Add EVERY user on the panel to an external squad',
        inputSchema: z.object({
            squadUuid: z.string().describe('Squad UUID'),
        }),
    }, async ({ squadUuid }) => {
        try { return toolResult(await client.addAllUsersToExternalSquad(squadUuid)); } catch (e) { return toolError(e); }
    });

    server.registerTool('external_squads_remove_all_users', {
        description: 'Remove EVERY user from an external squad',
        inputSchema: z.object({
            squadUuid: z.string().describe('Squad UUID'),
        }),
    }, async ({ squadUuid }) => {
        try { return toolResult(await client.removeAllUsersFromExternalSquad(squadUuid)); } catch (e) { return toolError(e); }
    });

    server.registerTool('external_squads_reorder', {
        description: 'Reorder external squads',
        inputSchema: z.object({
            items: z.array(z.object({
                viewPosition: z.number().describe('Sort position (0-based)'),
                uuid: z.string().describe('Squad UUID'),
            })).describe('Ordered array of { viewPosition, uuid } objects'),
        }),
    }, async (params) => {
        try { return toolResult(await client.reorderExternalSquads(params)); } catch (e) { return toolError(e); }
    });
}
