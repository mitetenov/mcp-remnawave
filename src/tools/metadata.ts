import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerMetadataTools(server: McpServer, client: RemnawaveClient) {
    server.registerTool('metadata_node_get', {
        description: 'Get metadata for a specific node',
        inputSchema: z.object({
            uuid: z.string().describe('Node UUID'),
        }),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getNodeMetadata(uuid)); } catch (e) { return toolError(e); }
    });

    server.registerTool('metadata_user_get', {
        description: 'Get metadata for a specific user',
        inputSchema: z.object({
            userId: z.number().describe('User ID'),
        }),
    }, async ({ userId }) => {
        try { return toolResult(await client.getUserMetadata(userId)); } catch (e) { return toolError(e); }
    });

    server.registerTool('metadata_node_upsert', {
        description: 'Create or update metadata for a node',
        inputSchema: z.object({
            uuid: z.string().describe('Node UUID'),
            metadata: z.object({}).catchall(z.unknown()).describe('Metadata key-value pairs'),
        }),
    }, async ({ uuid, metadata }) => {
        try { return toolResult(await client.upsertNodeMetadata(uuid, metadata)); } catch (e) { return toolError(e); }
    });

    server.registerTool('metadata_user_upsert', {
        description: 'Create or update metadata for a user',
        inputSchema: z.object({
            userId: z.number().describe('User ID'),
            metadata: z.object({}).catchall(z.unknown()).describe('Metadata key-value pairs'),
        }),
    }, async ({ userId, metadata }) => {
        try { return toolResult(await client.upsertUserMetadata(userId, metadata)); } catch (e) { return toolError(e); }
    });
}
