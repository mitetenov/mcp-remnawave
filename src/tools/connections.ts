import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerConnectionTools(server: McpServer, client: RemnawaveClient, readonly: boolean) {
    server.tool('connections_by_user', 'Request active connections for a user (async job)', {
        userId: z.number().describe('User ID'),
    }, async ({ userId }) => {
        try { return toolResult(await client.connectionsByUser(userId)); } catch (e) { return toolError(e); }
    });

    server.tool('connections_by_user_result', 'Get result of a by-user connections job', {
        jobId: z.string().describe('Job ID from connections_by_user'),
    }, async ({ jobId }) => {
        try { return toolResult(await client.connectionsByUserResult(jobId)); } catch (e) { return toolError(e); }
    });

    server.tool('connections_by_node', 'Request active connections for all users on a node (async job)', {
        nodeUuid: z.string().describe('Node UUID'),
    }, async ({ nodeUuid }) => {
        try { return toolResult(await client.connectionsByNode(nodeUuid)); } catch (e) { return toolError(e); }
    });

    server.tool('connections_by_node_result', 'Get result of a by-node connections job', {
        jobId: z.string().describe('Job ID from connections_by_node'),
    }, async ({ jobId }) => {
        try { return toolResult(await client.connectionsByNodeResult(jobId)); } catch (e) { return toolError(e); }
    });

    server.tool('connections_geocheck_by_node', 'Run a geolocation check for a node (async job)', {
        nodeUuid: z.string().describe('Node UUID'),
    }, async ({ nodeUuid }) => {
        try { return toolResult(await client.geocheckByNode(nodeUuid)); } catch (e) { return toolError(e); }
    });

    server.tool('connections_geocheck_by_node_result', 'Get result of a node geolocation check job', {
        jobId: z.string().describe('Job ID from connections_geocheck_by_node'),
    }, async ({ jobId }) => {
        try { return toolResult(await client.geocheckByNodeResult(jobId)); } catch (e) { return toolError(e); }
    });

    if (readonly) return;

    server.tool('connections_drop', 'Drop active connections by IP or user ID on specific/all nodes', {
        dropBy: z.union([
            z.object({
                by: z.literal('ipAddresses'),
                ipAddresses: z.array(z.string()).min(1).describe('Array of IP addresses'),
            }),
            z.object({
                by: z.literal('userIds'),
                userIds: z.array(z.number()).min(1).describe('Array of user IDs'),
            }),
        ]).describe('What to drop connections by'),
        targetNodes: z.union([
            z.object({
                target: z.literal('allNodes'),
            }),
            z.object({
                target: z.literal('specificNodes'),
                nodeUuids: z.array(z.string()).min(1).describe('Array of node UUIDs'),
            }),
        ]).describe('Which nodes to target'),
    }, async (params) => {
        try { return toolResult(await client.dropConnections(params)); } catch (e) { return toolError(e); }
    });
}
