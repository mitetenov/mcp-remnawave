import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

export function registerHwidTools(
    server: McpServer,
    client: RemnawaveClient,
) {
    if (client.isSupportMode) {
        registerSupportHwidTools(server, client);
        return;
    }

    server.registerTool(
        'hwid_devices_list',
        {
            description: 'List HWID devices for a specific user',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result = await client.getUserHwidDevices(userId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'hwid_devices_list_all',
        {
            description: 'List all HWID devices across all users',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getAllHwidDevices();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'hwid_stats',
        {
            description: 'Get HWID device statistics',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getHwidStats();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'hwid_top_users',
        {
            description: 'Get users with most HWID devices',
            inputSchema: z.object({}),
        },
        async () => {
            try {
                const result = await client.getHwidTopUsers();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'hwid_device_create',
        {
            description: 'Create a HWID device entry for a user',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
                hwid: z.string().describe('Hardware ID (10-64 chars, letters/digits/=/-)'),
                platform: z.string().optional().describe('Device platform'),
                osVersion: z.string().optional().describe('OS version'),
                deviceModel: z.string().optional().describe('Device model'),
                userAgent: z.string().optional().describe('User agent string'),
            }),
        },
        async (params) => {
            try {
                const result = await client.createUserHwidDevice(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'hwid_device_delete',
        {
            description: 'Delete a specific HWID device',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
                hwid: z.string().describe('HWID of the device to delete'),
            }),
        },
        async ({ userId, hwid }) => {
            try {
                const result = await client.deleteHwidDevice({ userId, hwid });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'hwid_devices_delete_all',
        {
            description: 'Delete all HWID devices for a user',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result =
                    await client.deleteAllUserHwidDevices({ userId });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

}

function registerSupportHwidTools(
    server: McpServer,
    client: RemnawaveClient,
) {
    server.registerTool(
        'hwid_devices_list',
        {
            description:
                'List the current HWID devices across every Remnawave account owned by the authenticated Telegram ID',
            inputSchema: z.object({
                telegramId: z.number().describe('Authenticated Telegram user ID'),
            }),
        },
        async ({ telegramId }) => {
            try {
                const result = await client.getSupportHwidDevicesByTelegramId(telegramId);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.registerTool(
        'hwid_device_delete',
        {
            description:
                'Delete one HWID device after verifying that its userId belongs to the authenticated Telegram ID and that the exact hwid is current',
            inputSchema: z.object({
                telegramId: z.number().describe('Authenticated Telegram user ID'),
                userId: z.number().describe('User ID from the current HWID list'),
                hwid: z.string().describe('HWID from the current HWID list'),
            }),
        },
        async ({ telegramId, userId, hwid }) => {
            try {
                const result = await client.deleteSupportHwidDeviceByTelegramId(
                    telegramId,
                    userId,
                    hwid,
                );
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    // Keep the declared support surface stable for direct MCP consumers. The
    // Python support router deliberately withholds this bulk mutation.
    server.registerTool(
        'hwid_devices_delete_all',
        {
            description: 'Delete all HWID devices for a user',
            inputSchema: z.object({
                userId: z.number().describe('User ID'),
            }),
        },
        async ({ userId }) => {
            try {
                const result = await client.deleteAllUserHwidDevices({ userId });
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
