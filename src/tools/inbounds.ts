import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerInboundTools(
    server: McpServer,
    client: RemnawaveClient,
) {
    server.registerTool(
        'config_profiles_list',
        {
            description: 'List all config profiles',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getConfigProfiles();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'config_profiles_get',
        {
            description: 'Get a config profile by UUID',
            inputSchema: z.object({
                uuid: z.string().describe('Config profile UUID'),
            }),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getConfigProfileByUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'inbounds_list',
        {
            description: 'List all inbounds from all config profiles',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getAllInbounds();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'config_profiles_get_inbounds',
        {
            description: 'Get inbounds for a specific config profile',
            inputSchema: z.object({
                uuid: z.string().describe('Config profile UUID'),
            }),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getInboundsByProfileUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'config_profiles_get_computed_config',
        {
            description: 'Get computed configuration for a config profile',
            inputSchema: z.object({
                uuid: z.string().describe('Config profile UUID'),
            }),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getComputedConfigByProfileUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'config_profiles_create',
        {
            description: 'Create a new config profile',
            inputSchema: z.object({
                name: z.string().describe('Profile name'),
                config: z.object({}).catchall(z.unknown()).describe('Config profile configuration object'),
            }),
        },
        async (params) => {
            try {
                const result = await client.createConfigProfile(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'config_profiles_update',
        {
            description: 'Update a config profile',
            inputSchema: z.object({
                uuid: z.string().describe('Profile UUID'),
                name: z.string().optional().describe('New name'),
            }),
        },
        async (params) => {
            try {
                const result = await client.updateConfigProfile(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'config_profiles_delete',
        {
            description: 'Delete a config profile',
            inputSchema: z.object({
                uuid: z.string().describe('Profile UUID'),
            }),
        },
        async ({ uuid }) => {
            try {
                await client.deleteConfigProfile(uuid);
                return toolResult({ success: true, message: `Profile ${uuid} deleted` });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'config_profiles_reorder',
        {
            description: 'Reorder config profiles',
            inputSchema: z.object({
                items: z.array(z.object({
                    viewPosition: z.number().describe('Sort position (0-based)'),
                    uuid: z.string().describe('Config profile UUID'),
                })).describe('Ordered array of { viewPosition, uuid } objects'),
            }),
        },
        async (params) => {
            try {
                const result = await client.reorderConfigProfiles(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
