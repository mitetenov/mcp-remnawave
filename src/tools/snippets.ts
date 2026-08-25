import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerSnippetTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('snippets_list', {
        description: 'List all configuration snippets',
        inputSchema: z.object({}),
    }, async () => {
        try { return toolResult(await client.getSnippets()); } catch (e) { return toolError(e); }
    });

    server.registerTool('snippets_create', {
        description: 'Create a new configuration snippet',
        inputSchema: z.object({
            name: z.string().describe('Snippet name'),
            snippet: z.array(z.object({}).catchall(z.unknown())).describe('Snippet content as array of objects'),
        }),
    }, async (params) => {
        try { return toolResult(await client.createSnippet(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('snippets_update', {
        description: 'Update an existing snippet',
        inputSchema: z.object({
            name: z.string().describe('Snippet name (identifies the snippet to update)'),
            snippet: z.array(z.object({}).catchall(z.unknown())).default([]).describe('New snippet content as array of objects'),
        }),
    }, async (params) => {
        try { return toolResult(await client.updateSnippet(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('snippets_sync', {
        description: 'Sync a snippet to all config profiles referencing it (restarts affected nodes)',
        inputSchema: z.object({
            name: z.string().describe('Snippet name to sync'),
        }),
    }, async (params) => {
        try { return toolResult(await client.syncSnippet(params)); } catch (e) { return toolError(e); }
    });

    server.registerTool('snippets_delete', {
        description: 'Delete a snippet by name',
        inputSchema: z.object({
            name: z.string().describe('Snippet name to delete'),
        }),
    }, async (params) => {
        try { return toolResult(await client.deleteSnippet(params)); } catch (e) { return toolError(e); }
    });
}
