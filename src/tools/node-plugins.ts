import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerNodePluginTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('node_plugins_list', {
        description: 'List all node plugins',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getNodePlugins()); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_get', {
        description: 'Get a node plugin by UUID',
        inputSchema: z.object({
            uuid: z.string().describe('Plugin UUID'),
        }),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getNodePlugin(uuid)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_shared_lists_list', {
        description: 'List all node plugin shared lists',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getSharedLists()); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_shared_lists_get', {
        description: 'Get a shared list by UUID',
        inputSchema: z.object({
            uuid: z.string().describe('Shared list UUID'),
        }),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getSharedList(uuid)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_torrent_reports', {
        description: 'Get torrent blocker reports',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getTorrentBlockerReports()); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_torrent_stats', {
        description: 'Get torrent blocker statistics',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getTorrentBlockerStats()); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_create', {
        description: 'Create a new node plugin',
        inputSchema: z.object({
            name: z.string().describe('Plugin name'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createNodePlugin(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_update', {
        description: 'Update a node plugin',
        inputSchema: z.object({
            uuid: z.string().describe('Plugin UUID'),
            name: z.string().optional().describe('New name'),
        }),
    }, async (params) => {
        try { return toolResult(await client.updateNodePlugin(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_delete', {
        description: 'Delete a node plugin',
        inputSchema: z.object({
            uuid: z.string().describe('Plugin UUID'),
        }),
    }, async ({ uuid }) => {
        try { await client.deleteNodePlugin(uuid); return toolResult({ success: true, message: `Plugin ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_reorder', {
        description: 'Reorder node plugins',
        inputSchema: z.object({
            items: z.array(z.object({
                viewPosition: z.number().describe('Sort position (0-based)'),
                uuid: z.string().describe('Plugin UUID'),
            })).describe('Ordered array of { viewPosition, uuid } objects'),
        }),
    }, async (params) => {
        try { return toolResult(await client.reorderNodePlugins(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_clone', {
        description: 'Clone a node plugin',
        inputSchema: z.object({
            cloneFromUuid: z.string().describe('Plugin UUID to clone'),
        }),
    }, async (params) => {
        try { return toolResult(await client.cloneNodePlugin(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_execute', {
        description: 'Execute a node plugin with a command on target nodes',
        inputSchema: z.object({
            command: z.union([
                z.object({
                    command: z.literal('blockIps'),
                    ips: z.array(z.object({
                        ip: z.string().describe('IP address to block'),
                        timeout: z.number().describe('Block timeout in seconds'),
                    })).min(1).describe('Array of IP addresses with timeouts'),
                }),
                z.object({
                    command: z.literal('unblockIps'),
                    ips: z.array(z.string()).min(1).describe('Array of IP addresses to unblock'),
                }),
                z.object({
                    command: z.literal('recreateTables'),
                }),
            ]).describe('Command to execute'),
            targetNodes: z.union([
                z.object({
                    target: z.literal('allNodes'),
                }),
                z.object({
                    target: z.literal('specificNodes'),
                    nodeUuids: z.array(z.string()).min(1).describe('Array of node UUIDs'),
                }),
            ]).describe('Which nodes to target'),
        }),
    }, async (params) => {
        try { return toolResult(await client.executeNodePlugin(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_sync', {
        description: 'Push a plugin config, including its shared lists, to every node it is active on',
        inputSchema: z.object({
            uuid: z.string().describe('Plugin UUID'),
        }),
    }, async (params) => {
        try { return toolResult(await client.syncNodePlugin(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_shared_lists_create', {
        description: 'Create a node plugin shared list',
        inputSchema: z.object({
            name: z.string().describe('Shared list name'),
            config: z.object({}).catchall(z.unknown()).describe('Shared list config key-value pairs'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createSharedList(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_shared_lists_update', {
        description: 'Update a node plugin shared list',
        inputSchema: z.object({
            name: z.string().describe('Shared list name (identifies the list to update)'),
            config: z.object({}).catchall(z.unknown()).describe('New config key-value pairs'),
        }),
    }, async (params) => {
        try { return toolResult(await client.updateSharedList(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_shared_lists_delete', {
        description: 'Delete a node plugin shared list',
        inputSchema: z.object({
            uuid: z.string().describe('Shared list UUID'),
        }),
    }, async ({ uuid }) => {
        try { await client.deleteSharedList(uuid); return toolResult({ success: true, message: `Shared list ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_shared_lists_sync', {
        description: 'Push every plugin referencing this shared list to the nodes it is active on',
        inputSchema: z.object({
            name: z.string().describe('Shared list name'),
        }),
    }, async (params) => {
        try { return toolResult(await client.syncSharedList(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('node_plugins_torrent_truncate', {
        description: 'Truncate all torrent blocker reports',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.truncateTorrentBlockerReports()); } catch (e) { return toolError(e); }
    });
}
