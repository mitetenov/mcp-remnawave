import { describe, it, expect, vi } from 'vitest';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { RemnawaveClient } from '../src/client/index.js';
import { registerAllTools } from '../src/tools/index.js';
import { registerAllResources } from '../src/resources/index.js';
import { registerAllPrompts } from '../src/prompts/index.js';

/**
 * The v1 -> v2 migration only changes registration call shape; these tests
 * pin the mechanical properties that shape depends on so a future edit can't
 * silently regress into the wrong SDK v2 pitfalls (bare-shape schemas,
 * omitted inputSchema on no-arg tools, dropped metadata).
 *
 * `vi.spyOn`'s captured `mock.calls` are typed against the SDK's overloaded
 * `register*` signatures, which don't line up with the narrower shapes these
 * tests assert against — every narrowing cast below goes through `unknown`
 * for that reason, not to paper over a real mismatch.
 */
function fakeClient(overrides: Record<string, unknown> = {}): RemnawaveClient {
    return overrides as unknown as RemnawaveClient;
}

type ToolCall = [string, { inputSchema?: z.ZodObject; description?: string }, (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
}>];

type ResourceCall = [string, unknown, { mimeType?: string; description?: string }, (uri: URL, params: Record<string, string>) => Promise<{ contents: Array<{ uri: string; text: string }> }>];

type PromptCall = [string, { argsSchema?: z.ZodObject; description?: string }, (args: Record<string, unknown>) => Promise<{ messages: Array<{ content: { text: string } }> }>];

describe('tool registrations (v2 API shape)', () => {
    it('registers exactly 179 tools, each with a root z.object inputSchema and a description', () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerTool');

        registerAllTools(server, fakeClient());

        expect(spy).toHaveBeenCalledTimes(179);

        const calls = spy.mock.calls as unknown as ToolCall[];
        const names = calls.map((call) => call[0]);
        expect(new Set(names).size).toBe(179);

        for (const [name, config] of calls) {
            expect(config.inputSchema, `missing inputSchema for ${name}`).toBeInstanceOf(z.ZodObject);
            expect(typeof config.description, `missing description for ${name}`).toBe('string');
            expect((config.description ?? '').length, `empty description for ${name}`).toBeGreaterThan(0);
        }
    });

    it('preserves default/optional/describe metadata on representative schemas', () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerTool');
        registerAllTools(server, fakeClient());
        const calls = spy.mock.calls as unknown as ToolCall[];

        const usersList = calls.find((call) => call[0] === 'users_list')!;
        const listSchema = usersList[1].inputSchema!;
        expect(listSchema.shape.start._zod.def.type).toBe('default');
        expect(listSchema.shape.size._zod.def.type).toBe('default');

        const hwidCreate = calls.find((call) => call[0] === 'hwid_device_create')!;
        const hwidSchema = hwidCreate[1].inputSchema!;
        expect(hwidSchema.shape.platform._zod.def.type).toBe('optional');
        expect(hwidSchema.shape.hwid.description).toBe(
            'Hardware ID (10-64 chars, letters/digits/=/-)',
        );

        const hostsCreate = calls.find((call) => call[0] === 'hosts_create')!;
        const hostsSchema = hostsCreate[1].inputSchema!;
        expect(hostsSchema.shape.remark.description).toBe('Host remark/name');

        // A required field stays a bare (non-optional, non-default) schema node.
        expect(hostsSchema.shape.remark._zod.def.type).toBe('string');
    });

    it('gives every no-argument tool an explicit empty-object schema', () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerTool');
        registerAllTools(server, fakeClient());
        const calls = spy.mock.calls as unknown as ToolCall[];

        const keygenCall = calls.find((call) => call[0] === 'keygen_get')!;
        const schema = keygenCall[1].inputSchema!;

        // v2 treats a missing `inputSchema` as "no schema" and hands the
        // callback a request-context object instead of parsed arguments.
        // Every no-arg tool must instead declare `z.object({})` explicitly.
        expect(schema).toBeInstanceOf(z.ZodObject);
        expect(Object.keys(schema.shape)).toHaveLength(0);
    });

    it('invokes a no-argument tool callback with {} and returns toolResult content', async () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerTool');
        const getKeygen = vi.fn().mockResolvedValue({ key: 'abc' });
        registerAllTools(server, fakeClient({ getKeygen }));
        const calls = spy.mock.calls as unknown as ToolCall[];

        const keygenCall = calls.find((call) => call[0] === 'keygen_get')!;
        const result = await keygenCall[2]({});

        expect(getKeygen).toHaveBeenCalledOnce();
        expect(result.content[0].type).toBe('text');
        expect(JSON.parse(result.content[0].text)).toEqual({ key: 'abc' });
    });

    it('returns a toolError with isError when the callback throws', async () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerTool');
        const getKeygen = vi.fn().mockRejectedValue(new Error('boom'));
        registerAllTools(server, fakeClient({ getKeygen }));
        const calls = spy.mock.calls as unknown as ToolCall[];

        const keygenCall = calls.find((call) => call[0] === 'keygen_get')!;
        const result = await keygenCall[2]({});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe('Error: boom');
    });
});

describe('resource registrations (v2 API shape)', () => {
    it('registers exactly 4 resources, each with explicit metadata', () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerResource');
        registerAllResources(server, fakeClient());
        const calls = spy.mock.calls as unknown as ResourceCall[];

        expect(calls).toHaveLength(4);
        for (const [name, , metadata] of calls) {
            expect(metadata, `missing metadata for resource ${name}`).toBeDefined();
            expect(metadata.mimeType).toBe('application/json');
            expect(typeof metadata.description).toBe('string');
        }
    });

    it('keeps the user-details URI template callable with substituted params', async () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerResource');
        const getUserById = vi.fn().mockResolvedValue({ id: 42, username: 'alice' });
        registerAllResources(server, fakeClient({ getUserById }));
        const calls = spy.mock.calls as unknown as ResourceCall[];

        const userDetails = calls.find((call) => call[0] === 'user-details')!;
        const [, uriTemplate, , callback] = userDetails;

        expect(uriTemplate).toBeInstanceOf(ResourceTemplate);

        const result = await callback(new URL('remnawave://users/42'), { userId: '42' });

        expect(getUserById).toHaveBeenCalledWith(42);
        expect(result.contents[0].uri).toBe('remnawave://users/42');
        expect(JSON.parse(result.contents[0].text)).toEqual({ id: 42, username: 'alice' });
    });
});

describe('prompt registrations (v2 API shape)', () => {
    it('registers exactly 5 prompts, each with a callable argsSchema-driven callback', () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerPrompt');
        registerAllPrompts(server);
        const calls = spy.mock.calls as unknown as PromptCall[];

        expect(calls).toHaveLength(5);
        for (const [name, config] of calls) {
            expect(config.argsSchema, `missing argsSchema for prompt ${name}`).toBeInstanceOf(z.ZodObject);
            expect(typeof config.description).toBe('string');
        }
    });

    it('interpolates prompt arguments into the generated message text', async () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerPrompt');
        registerAllPrompts(server);
        const calls = spy.mock.calls as unknown as PromptCall[];

        const audit = calls.find((call) => call[0] === 'user_audit')!;
        const result = await audit[2]({ userId: '99' });

        expect(result.messages[0].content.text).toContain('99');
    });

    it('gives the zero-argument prompt an explicit empty-object argsSchema', () => {
        const server = new McpServer({ name: 'shape-test', version: '1.0.0' });
        const spy = vi.spyOn(server, 'registerPrompt');
        registerAllPrompts(server);
        const calls = spy.mock.calls as unknown as PromptCall[];

        const cleanup = calls.find((call) => call[0] === 'bulk_user_cleanup')!;
        const schema = cleanup[1].argsSchema!;

        expect(Object.keys(schema.shape)).toHaveLength(0);
    });
});
