import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerBandwidthTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('bandwidth_nodes_list', {
        description: 'Get bandwidth usage per node',
        inputSchema: z.object({
            start: z.string().describe('Start date (YYYY-MM-DD)'),
            end: z.string().describe('End date (YYYY-MM-DD)'),
        }),
    }, async ({ start, end }) => {
        try { return toolResult(await client.getNodesBandwidth({ start, end })); } catch (e) { return toolError(e); }
    });

    server.registerTool('bandwidth_nodes_realtime', {
        description: 'Get realtime bandwidth usage per node',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getNodesRealtimeBandwidth()); } catch (e) { return toolError(e); }
    });

    server.registerTool('bandwidth_user_usage', {
        description: 'Get bandwidth usage for a single user',
        inputSchema: z.object({
            userId: z.number().describe('User ID'),
            start: z.string().describe('Start date (YYYY-MM-DD)'),
            end: z.string().describe('End date (YYYY-MM-DD)'),
        }),
    }, async ({ userId, start, end }) => {
        try { return toolResult(await client.getUserBandwidthByUserId(userId, { start, end })); } catch (e) { return toolError(e); }
    });

    server.registerTool(
        'bandwidth_nodes_usage',
        {
            description: 'List users exceeding a traffic threshold on the given nodes over a period',
            inputSchema: z.object({
                nodesUuids: z.array(z.string()).min(1).describe('Node UUIDs to include'),
                start: z.string().describe('Start date (YYYY-MM-DD)'),
                end: z.string().describe('End date (YYYY-MM-DD)'),
                minTotalBytes: z
                    .number()
                    .optional()
                    .describe('Only include users whose total usage over the period is >= this (bytes)'),
            }),
        },
        async ({ nodesUuids, start, end, minTotalBytes }) => {
            try {
                return toolResult(
                    await client.getNodesUsage({ nodesUuids }, { start, end, minTotalBytes }),
                );
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'bandwidth_squad_usage',
        {
            description: 'Get traffic usage of an internal squad users over a period',
            inputSchema: z.object({
                squadUuid: z.string().describe('Internal squad UUID'),
                start: z.string().describe('Start date (YYYY-MM-DD)'),
                end: z.string().describe('End date (YYYY-MM-DD)'),
                minTotalBytes: z.number().optional().describe('Minimum total usage in bytes'),
                limit: z.number().optional().describe('Number of users to return (max 1000)'),
                cursor: z.number().optional().describe('Pagination cursor'),
            }),
        },
        async ({ squadUuid, ...query }) => {
            try {
                return toolResult(await client.getInternalSquadUsage(squadUuid, query));
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'bandwidth_squad_user_usage',
        {
            description: 'Get daily traffic usage of a single user on internal squad nodes over a period',
            inputSchema: z.object({
                squadUuid: z.string().describe('Internal squad UUID'),
                userId: z.number().describe('User ID'),
                start: z.string().describe('Start date (YYYY-MM-DD)'),
                end: z.string().describe('End date (YYYY-MM-DD)'),
            }),
        },
        async ({ squadUuid, userId, start, end }) => {
            try {
                return toolResult(
                    await client.getInternalSquadUserUsage(squadUuid, userId, { start, end }),
                );
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
