import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { TestSrrMatcherCommand } from '@remnawave/backend-contract';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerSystemTools(
    server: McpServer,
    client: RemnawaveClient,
) {
    server.registerTool(
        'system_stats',
        {
            description: 'Get overall Remnawave panel statistics (users, nodes, traffic, memory, CPU)',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getStats();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_bandwidth_stats',
        {
            description: 'Get bandwidth statistics',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getBandwidthStats();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_nodes_metrics',
        {
            description: 'Get detailed node metrics',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getNodesMetrics();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_nodes_statistics',
        {
            description: 'Get node statistics',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getNodesStatistics();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_health',
        {
            description: 'Check Remnawave panel health status',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getHealth();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_metadata',
        {
            description: 'Get Remnawave panel metadata and version information',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getSystemMetadata();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_generate_x25519',
        {
            description: 'Generate X25519 key pair for VLESS Reality',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.generateX25519();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'auth_status',
        {
            description: 'Check current authentication status with Remnawave panel',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getAuthStatus();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_stats_recap',
        {
            description: 'Get system statistics recap',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getStatsRecap();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_stats_digest',
        {
            description: 'Get a digest of system statistics',
            inputSchema: z.object({
                start: z
                    .string()
                    .describe('Start of the period, ISO 8601 with timezone offset (e.g. 2026-07-15T00:00:00Z)'),
                end: z
                    .string()
                    .describe('End of the period, ISO 8601 with timezone offset (e.g. 2026-07-15T00:00:00Z)'),
            }),
        },
        async ({ start, end }) => {
            try {
                const result = await client.getStatsDigest({ start, end });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_http_stats',
        {
            description: 'Get HTTP route statistics of the panel',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getHttpStats();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_configuration',
        {
            description: 'Get the current panel configuration',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getConfiguration();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'system_srr_matcher',
        {
            description: 'Test subscription request routing rules',
            inputSchema: z.object({
                responseRules: z.object({}).catchall(z.unknown()).describe('Response rules configuration object with version and rules array'),
            }),
        },
        async (params) => {
            try {
                const result = await client.testSrrMatcher(params as TestSrrMatcherCommand.RequestBody);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
