import { describe, it, expect } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RemnawaveClient } from '../src/client/index.js';
import { registerAllTools } from '../src/tools/index.js';
import { registerAllResources } from '../src/resources/index.js';
import { registerAllPrompts } from '../src/prompts/index.js';
import { restrictToSupport } from '../src/support-filter.js';
import {
    SUPPORT_PROMPTS,
    SUPPORT_RESOURCES,
    SUPPORT_TOOLS,
} from '../src/support-profile.js';

function collect(isSupport: boolean) {
    const tools: string[] = [];
    const resources: string[] = [];
    const prompts: string[] = [];
    const mock = {
        tool: (name: string) => { tools.push(name); return mock; },
        resource: (name: string) => { resources.push(name); return mock; },
        prompt: (name: string) => { prompts.push(name); return mock; },
    } as unknown as McpServer;

    const client = new RemnawaveClient({
        baseUrl: 'https://panel.example.com',
        apiToken: 'test-token',
        isSupport,
    });
    const target = isSupport ? restrictToSupport(mock) : mock;

    registerAllTools(target, client);
    registerAllResources(target, client);
    registerAllPrompts(target);

    return { tools, resources, prompts };
}

describe('support mode', () => {
    it('registers exactly the support profile', () => {
        const { tools, resources, prompts } = collect(true);

        expect(new Set(tools)).toEqual(SUPPORT_TOOLS);
        expect(new Set(resources)).toEqual(SUPPORT_RESOURCES);
        expect(new Set(prompts)).toEqual(SUPPORT_PROMPTS);
    });

    it('exposes exactly one mutating tool', () => {
        const { tools } = collect(true);
        const mutating = tools.filter((name) => name.startsWith('hwid_device') && name.includes('delete'));

        expect(mutating.sort()).toEqual(['hwid_device_delete', 'hwid_devices_delete_all']);
        expect(tools).not.toContain('users_update');
        expect(tools).not.toContain('users_extend_expiration');
        expect(tools).not.toContain('users_delete');
        expect(tools).not.toContain('keygen_get');
        expect(tools).not.toContain('users_list');
    });

    it('can look a user up by telegram id', () => {
        const { tools } = collect(true);

        // The bot's only entry point: it knows the sender's Telegram ID and
        // nothing else about the account.
        expect(tools).toContain('users_get_by_telegram_id');
        expect(tools).toContain('users_get_subscription_url_by_telegram_id');
    });

    it('every profile name exists in full mode', () => {
        const full = collect(false);

        // Guards against a rename silently dropping a tool out of the profile.
        for (const name of SUPPORT_TOOLS) {
            expect(full.tools, `missing tool: ${name}`).toContain(name);
        }
        for (const name of SUPPORT_RESOURCES) {
            expect(full.resources, `missing resource: ${name}`).toContain(name);
        }
        for (const name of SUPPORT_PROMPTS) {
            expect(full.prompts, `missing prompt: ${name}`).toContain(name);
        }
    });

    it('full mode filters nothing', () => {
        const { tools, resources, prompts } = collect(false);

        expect(tools).toHaveLength(180);
        expect(resources).toHaveLength(4);
        expect(prompts).toHaveLength(5);
        expect(new Set(tools).size).toBe(180);
    });
});
