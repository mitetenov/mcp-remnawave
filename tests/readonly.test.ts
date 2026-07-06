import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RemnawaveClient } from '../src/client/index.js';
import { registerUserTools } from '../src/tools/users.js';
import { registerNodeTools } from '../src/tools/nodes.js';
import { registerHostTools } from '../src/tools/hosts.js';
import { registerIpControlTools } from '../src/tools/ip-control.js';
import { registerSquadTools } from '../src/tools/squads.js';
import { registerHwidTools } from '../src/tools/hwid.js';
import { registerApiTokenTools } from '../src/tools/api-tokens.js';
import { registerInfraBillingTools } from '../src/tools/infra-billing.js';
import { registerSnippetTools } from '../src/tools/snippets.js';
import { registerExternalSquadTools } from '../src/tools/external-squads.js';
import { registerSettingsTools } from '../src/tools/settings.js';
import { registerSubPageConfigTools } from '../src/tools/subscription-page-configs.js';
import { registerNodePluginTools } from '../src/tools/node-plugins.js';
import { registerMetadataTools } from '../src/tools/metadata.js';

describe('readonly mode', () => {
    let server: McpServer;
    let client: RemnawaveClient;
    let toolCalls: string[];

    beforeEach(() => {
        toolCalls = [];
        server = new McpServer({ name: 'test', version: '1.0.0' });
        client = new RemnawaveClient({
            baseUrl: 'https://panel.example.com',
            apiToken: 'test-token',
            readonly: false,
        });
    });

    // Helper: count how many tools are registered on the server
    // We can't directly inspect McpServer internals, so we intercept the tool registration
    function countTools(fn: (server: McpServer, client: RemnawaveClient, readonly: boolean) => void, readonly: boolean): number {
        let count = 0;
        const mockServer = {
            tool: vi.fn(() => { count++; return mockServer; }),
        } as unknown as McpServer;
        fn(mockServer, client, readonly);
        return count;
    }

    it('users: registers read-only tools when readonly=true', () => {
        const readCount = countTools(registerUserTools, true);
        const writeCount = countTools(registerUserTools, false);

        // Read-only tools should be fewer than read-write tools
        expect(readCount).toBeLessThan(writeCount);
        // The number of read-only tools = read tools (list, get, get_by_*, tags_list, resolve)
        // The full set adds create, update, delete, enable, disable, revoke, reset, bulk operations
        expect(readCount).toBeGreaterThan(0);
    });

    it('nodes: registers read-only tools when readonly=true', () => {
        const readCount = countTools(registerNodeTools, true);
        const writeCount = countTools(registerNodeTools, false);

        expect(readCount).toBeLessThan(writeCount);
        expect(readCount).toBeGreaterThan(0);
    });

    it('hosts: registers read-only tools when readonly=true', () => {
        const readCount = countTools(registerHostTools, true);
        const writeCount = countTools(registerHostTools, false);

        expect(readCount).toBeLessThan(writeCount);
        expect(readCount).toBeGreaterThan(0);
    });

    it('IP control: registers read-only tools when readonly=true', () => {
        const readCount = countTools(registerIpControlTools, true);
        const writeCount = countTools(registerIpControlTools, false);

        // IP control has 4 read tools and 1 write (drop_connections)
        expect(readCount).toBe(4);
        expect(writeCount).toBe(5);
    });

    it('squads: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerSquadTools, true);
        const writeCount = countTools(registerSquadTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });

    it('hwid: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerHwidTools, true);
        const writeCount = countTools(registerHwidTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });

    it('api-tokens: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerApiTokenTools, true);
        const writeCount = countTools(registerApiTokenTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });

    it('infra-billing: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerInfraBillingTools, true);
        const writeCount = countTools(registerInfraBillingTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });

    it('snippets: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerSnippetTools, true);
        const writeCount = countTools(registerSnippetTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });

    it('external-squads: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerExternalSquadTools, true);
        const writeCount = countTools(registerExternalSquadTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });

    it('settings: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerSettingsTools, true);
        const writeCount = countTools(registerSettingsTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });

    it('subscription-page-configs: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerSubPageConfigTools, true);
        const writeCount = countTools(registerSubPageConfigTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });

    it('node-plugins: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerNodePluginTools, true);
        const writeCount = countTools(registerNodePluginTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });

    it('metadata: registers fewer tools in readonly mode', () => {
        const readCount = countTools(registerMetadataTools, true);
        const writeCount = countTools(registerMetadataTools, false);
        expect(readCount).toBeLessThan(writeCount);
    });
});
