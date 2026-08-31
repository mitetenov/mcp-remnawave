import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { CreateNodeCommand } from '@remnawave/backend-contract';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerNodeTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool(
        'nodes_list',
        {
            description: 'List all Remnawave nodes',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getNodes();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_get',
        {
            description: 'Get a specific node by UUID',
            inputSchema: z.object({
                uuid: z.string().describe('Node UUID'),
            }),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getNodeByUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_tags_list',
        {
            description: 'List all node tags',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getNodeTags();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_create',
        {
            description: 'Create a new node in Remnawave',
            inputSchema: z.object({
                name: z.string().describe('Node name'),
                address: z.string().describe('Node address (IP or hostname)'),
                port: z.number().optional().describe('Node port'),
                countryCode: z
                    .string()
                    .optional()
                    .describe('Country code (e.g. US, DE, NL)'),
                isTrafficTrackingActive: z
                    .boolean()
                    .optional()
                    .describe('Enable traffic tracking'),
                trafficLimitBytes: z
                    .number()
                    .optional()
                    .describe('Traffic limit in bytes'),
                trafficResetDay: z
                    .number()
                    .optional()
                    .describe('Day of month to reset traffic (1-31)'),
                notifyPercent: z
                    .number()
                    .optional()
                    .describe('Traffic notification threshold percentage'),
                consumptionMultiplier: z
                    .number()
                    .optional()
                    .describe('Traffic consumption multiplier'),
                nodeConsumptionMultiplier: z
                    .number()
                    .optional()
                    .describe('Node consumption multiplier (Remnawave 2.8+)'),
                note: z
                    .string()
                    .max(255)
                    .optional()
                    .describe('Node note (max 255 chars)'),
                proxyUrl: z
                    .string()
                    .optional()
                    .describe('SOCKS5 proxy URL'),
                activeConfigProfileUuid: z
                    .string()
                    .describe('Config profile UUID to assign'),
                activeInbounds: z
                    .array(z.string())
                    .describe('Array of inbound UUIDs to enable'),
            }),
        },
        async (params) => {
            try {
                const body: Record<string, unknown> = {
                    name: params.name,
                    address: params.address,
                    configProfile: {
                        activeConfigProfileUuid:
                            params.activeConfigProfileUuid,
                        activeInbounds: params.activeInbounds,
                    },
                };
                if (params.port !== undefined) body.port = params.port;
                if (params.countryCode !== undefined)
                    body.countryCode = params.countryCode;
                if (params.isTrafficTrackingActive !== undefined)
                    body.isTrafficTrackingActive =
                        params.isTrafficTrackingActive;
                if (params.trafficLimitBytes !== undefined)
                    body.trafficLimitBytes = params.trafficLimitBytes;
                if (params.trafficResetDay !== undefined)
                    body.trafficResetDay = params.trafficResetDay;
                if (params.notifyPercent !== undefined)
                    body.notifyPercent = params.notifyPercent;
                if (params.consumptionMultiplier !== undefined)
                    body.consumptionMultiplier = params.consumptionMultiplier;
                if (params.nodeConsumptionMultiplier !== undefined)
                    body.nodeConsumptionMultiplier = params.nodeConsumptionMultiplier;
                if (params.note !== undefined)
                    body.note = params.note;
                if (params.proxyUrl !== undefined)
                    body.proxyUrl = params.proxyUrl;

                const result = await client.createNode(body as CreateNodeCommand.RequestBody);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_update',
        {
            description: 'Update an existing node',
            inputSchema: z.object({
                uuid: z.string().describe('Node UUID to update'),
                name: z.string().optional().describe('New node name'),
                address: z.string().optional().describe('New address'),
                port: z.number().optional().describe('New port'),
                countryCode: z.string().optional().describe('New country code'),
                isTrafficTrackingActive: z
                    .boolean()
                    .optional()
                    .describe('Enable/disable traffic tracking'),
                trafficLimitBytes: z
                    .number()
                    .optional()
                    .describe('New traffic limit'),
                trafficResetDay: z
                    .number()
                    .optional()
                    .describe('New traffic reset day'),
                notifyPercent: z
                    .number()
                    .optional()
                    .describe('New notification threshold'),
                consumptionMultiplier: z
                    .number()
                    .optional()
                    .describe('New consumption multiplier'),
                nodeConsumptionMultiplier: z
                    .number()
                    .optional()
                    .describe('New node consumption multiplier (Remnawave 2.8+)'),
                note: z
                    .string()
                    .max(255)
                    .optional()
                    .describe('Node note (max 255 chars)'),
                proxyUrl: z
                    .string()
                    .optional()
                    .describe('SOCKS5 proxy URL'),
            }),
        },
        async (params) => {
            try {
                const result = await client.updateNode(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_delete',
        {
            description: 'Delete a node from Remnawave',
            inputSchema: z.object({
                uuid: z.string().describe('Node UUID to delete'),
            }),
        },
        async ({ uuid }) => {
            try {
                await client.deleteNode(uuid);
                return toolResult({
                    success: true,
                    message: `Node ${uuid} deleted`,
                });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_enable',
        {
            description: 'Enable a disabled node',
            inputSchema: z.object({
                uuid: z.string().describe('Node UUID'),
            }),
        },
        async ({ uuid }) => {
            try {
                const result = await client.enableNode(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_disable',
        {
            description: 'Disable a node',
            inputSchema: z.object({
                uuid: z.string().describe('Node UUID'),
            }),
        },
        async ({ uuid }) => {
            try {
                const result = await client.disableNode(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_restart',
        {
            description: 'Restart a specific node',
            inputSchema: z.object({
                uuid: z.string().describe('Node UUID'),
                forceRestart: z
                    .boolean()
                    .describe('Force restart (required by the panel)'),
            }),
        },
        async ({ uuid, forceRestart }) => {
            try {
                const result = await client.restartNode(uuid, forceRestart);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_restart_all',
        {
            description: 'Restart all nodes',
            inputSchema: z.object({
                forceRestart: z
                    .boolean()
                    .describe('Force restart (required by the panel)'),
            }),
        },
        async ({ forceRestart }) => {
            try {
                const result = await client.restartAllNodes(forceRestart);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_reset_traffic',
        {
            description: 'Reset traffic counter for a node',
            inputSchema: z.object({
                uuid: z.string().describe('Node UUID'),
            }),
        },
        async ({ uuid }) => {
            try {
                const result = await client.resetNodeTraffic(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_reorder',
        {
            description: 'Reorder nodes by providing an ordered array of node positions',
            inputSchema: z.object({
                nodes: z
                    .array(z.object({
                        viewPosition: z.number().describe('Sort position (0-based)'),
                        uuid: z.string().describe('Node UUID'),
                    }))
                    .describe('Ordered array of { viewPosition, uuid } objects'),
            }),
        },
        async ({ nodes }) => {
            try {
                const result = await client.reorderNodes(nodes);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_bulk_profile_modification',
        {
            description: 'Bulk modify config profile for selected nodes',
            inputSchema: z.object({
                uuids: z.array(z.string()).describe('Array of node UUIDs'),
                configProfileUuid: z.string().describe('New config profile UUID'),
                activeInbounds: z.array(z.string()).describe('Array of inbound UUIDs to enable'),
            }),
        },
        async (params) => {
            try {
                const body = {
                    uuids: params.uuids,
                    configProfile: {
                        activeConfigProfileUuid: params.configProfileUuid,
                        activeInbounds: params.activeInbounds,
                    },
                };
                const result = await client.bulkNodeProfileModification(body);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_bulk_actions',
        {
            description: 'Bulk actions on selected nodes (enable/disable/restart/reset traffic)',
            inputSchema: z.object({
                uuids: z.array(z.string()).describe('Array of node UUIDs'),
                action: z.enum(['ENABLE', 'DISABLE', 'RESTART', 'RESET_TRAFFIC']).describe('Action to perform'),
            }),
        },
        async (params) => {
            try {
                const result = await client.bulkNodeActions(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'nodes_bulk_update',
        {
            description: 'Bulk update properties for selected nodes',
            inputSchema: z.object({
                uuids: z.array(z.string()).describe('Array of node UUIDs'),
                countryCode: z.string().optional().describe('New country code'),
                consumptionMultiplier: z.number().optional().describe('New consumption multiplier'),
                providerUuid: z.string().optional().describe('Infra provider UUID'),
                tags: z.array(z.string()).optional().describe('Node tags'),
                activePluginUuid: z.string().optional().describe('Active plugin UUID'),
            }),
        },
        async (params) => {
            try {
                const { uuids, ...fields } = params;
                const result = await client.bulkUpdateNodes({ uuids, fields });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
