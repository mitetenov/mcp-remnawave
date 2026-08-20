import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerBandwidthTools(server: McpServer, client: RemnawaveClient) {
    server.tool('bandwidth_nodes_list', 'Get bandwidth usage per node', {
        start: z.string().describe('Start date (YYYY-MM-DD)'),
        end: z.string().describe('End date (YYYY-MM-DD)'),
    }, async ({ start, end }) => {
        try { return toolResult(await client.getNodesBandwidth({ start, end })); } catch (e) { return toolError(e); }
    });

    server.tool('bandwidth_nodes_realtime', 'Get realtime bandwidth usage per node', {}, async () => {
        try { return toolResult(await client.getNodesRealtimeBandwidth()); } catch (e) { return toolError(e); }
    });

    server.tool('bandwidth_user_usage', 'Get bandwidth usage for a single user', {
        userId: z.number().describe('User ID'),
        start: z.string().describe('Start date (YYYY-MM-DD)'),
        end: z.string().describe('End date (YYYY-MM-DD)'),
    }, async ({ userId, start, end }) => {
        try { return toolResult(await client.getUserBandwidthByUserId(userId, { start, end })); } catch (e) { return toolError(e); }
    });

    server.tool(
        'bandwidth_nodes_usage',
        'List users exceeding a traffic threshold on the given nodes over a period',
        {
            nodesUuids: z.array(z.string()).min(1).describe('Node UUIDs to include'),
            start: z.string().describe('Start date (YYYY-MM-DD)'),
            end: z.string().describe('End date (YYYY-MM-DD)'),
            minTotalBytes: z
                .number()
                .optional()
                .describe('Only include users whose total usage over the period is >= this (bytes)'),
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

    server.tool(
        'bandwidth_squad_usage',
        'Get traffic usage of an internal squad users over a period',
        {
            squadUuid: z.string().describe('Internal squad UUID'),
            start: z.string().describe('Start date (YYYY-MM-DD)'),
            end: z.string().describe('End date (YYYY-MM-DD)'),
            minTotalBytes: z.number().optional().describe('Minimum total usage in bytes'),
            limit: z.number().optional().describe('Number of users to return (max 1000)'),
            cursor: z.number().optional().describe('Pagination cursor'),
        },
        async ({ squadUuid, ...query }) => {
            try {
                return toolResult(await client.getInternalSquadUsage(squadUuid, query));
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'bandwidth_squad_user_usage',
        'Get daily traffic usage of a single user on internal squad nodes over a period',
        {
            squadUuid: z.string().describe('Internal squad UUID'),
            userId: z.number().describe('User ID'),
            start: z.string().describe('Start date (YYYY-MM-DD)'),
            end: z.string().describe('End date (YYYY-MM-DD)'),
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
