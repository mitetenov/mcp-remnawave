import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { restrictToSupport } from '../src/support-filter.js';

function makeServer() {
    return new McpServer({ name: 'test', version: '3.0.0' });
}

describe('restrictToSupport', () => {
    it('registers an allowlisted tool and drops everything else', () => {
        const server = makeServer();
        const spy = vi.spyOn(server, 'registerTool').mockReturnValue(undefined as never);
        const gated = restrictToSupport(server);

        gated.registerTool('users_get', { inputSchema: z.object({}) }, async () => ({ content: [] }));
        gated.registerTool('users_delete', { inputSchema: z.object({}) }, async () => ({ content: [] }));
        gated.registerTool('keygen_get', { inputSchema: z.object({}) }, async () => ({ content: [] }));

        expect(spy.mock.calls.map((call) => call[0])).toEqual(['users_get']);
    });

    it('gates resources and prompts by their own allowlists', () => {
        const server = makeServer();
        const resourceSpy = vi.spyOn(server, 'registerResource').mockReturnValue(undefined as never);
        const promptSpy = vi.spyOn(server, 'registerPrompt').mockReturnValue(undefined as never);
        const gated = restrictToSupport(server);

        gated.registerResource('user-details', 'remnawave://users/{userId}', {}, async () => ({ contents: [] }));
        gated.registerResource('panel-stats', 'remnawave://stats', {}, async () => ({ contents: [] }));
        gated.registerPrompt('user_audit', { argsSchema: z.object({}) }, async () => ({ messages: [] }));
        gated.registerPrompt('bulk_user_cleanup', { argsSchema: z.object({}) }, async () => ({ messages: [] }));

        expect(resourceSpy.mock.calls.map((call) => call[0])).toEqual(['user-details']);
        expect(promptSpy.mock.calls.map((call) => call[0])).toEqual(['user_audit']);
    });

    it('forwards non-gated members with the target as receiver', () => {
        class PrivateFieldHost {
            #secret = 'kept';

            get secret() {
                return this.#secret;
            }

            registerTool(_name: string) {
                return this;
            }
        }

        const host = new PrivateFieldHost();
        const gated = restrictToSupport(host as unknown as McpServer) as unknown as PrivateFieldHost;

        // Reading a #private field through a proxy throws unless the get trap
        // forwards `target` as the receiver when invoking property getters.
        expect((gated as unknown as { secret: string }).secret).toBe('kept');
    });

    it('binds forwarded non-gated methods to the target', () => {
        class PrivateFieldHost {
            #secret = 'kept';

            registerTool(_name: string) {
                return this;
            }

            readSecret() {
                return this.#secret;
            }
        }

        const host = new PrivateFieldHost();
        const gated = restrictToSupport(host as unknown as McpServer) as unknown as PrivateFieldHost;

        // `readSecret` is not one of the three gated method names, so it takes
        // the `.bind(target)` path. Without that bind, calling it through the
        // proxy would run with `this` set to the proxy, and the `#secret`
        // read inside would throw.
        expect(gated.readSecret()).toBe('kept');
    });
});
