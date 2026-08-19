import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { restrictToSupport } from '../src/support-filter.js';

function makeServer() {
    return new McpServer({ name: 'test', version: '3.0.0' });
}

describe('restrictToSupport', () => {
    it('registers an allowlisted tool and drops everything else', () => {
        const server = makeServer();
        const spy = vi.spyOn(server, 'tool').mockReturnValue(undefined as never);
        const gated = restrictToSupport(server);

        gated.tool('users_get', 'd', {}, async () => ({ content: [] }));
        gated.tool('users_delete', 'd', {}, async () => ({ content: [] }));
        gated.tool('keygen_get', 'd', {}, async () => ({ content: [] }));

        expect(spy.mock.calls.map((call) => call[0])).toEqual(['users_get']);
    });

    it('gates the registerTool alias too', () => {
        const server = makeServer();
        const spy = vi.spyOn(server, 'registerTool').mockReturnValue(undefined as never);
        // registerTool's real overloads demand a populated config object. The
        // spy never reads it, so call through a loose view rather than
        // building one just to satisfy the compiler.
        const gated = restrictToSupport(server) as unknown as {
            registerTool: (name: string, ...rest: unknown[]) => unknown;
        };

        gated.registerTool('hwid_device_delete', {}, async () => ({ content: [] }));
        gated.registerTool('users_delete', {}, async () => ({ content: [] }));

        expect(spy.mock.calls.map((call) => call[0])).toEqual(['hwid_device_delete']);
    });

    it('gates resources and prompts by their own allowlists', () => {
        const server = makeServer();
        const resourceSpy = vi.spyOn(server, 'resource').mockReturnValue(undefined as never);
        const promptSpy = vi.spyOn(server, 'prompt').mockReturnValue(undefined as never);
        const gated = restrictToSupport(server);

        gated.resource('user-details', 'remnawave://users/{userId}', async () => ({ contents: [] }));
        gated.resource('panel-stats', 'remnawave://stats', async () => ({ contents: [] }));
        gated.prompt('user_audit', 'd', {}, async () => ({ messages: [] }));
        gated.prompt('bulk_user_cleanup', 'd', {}, async () => ({ messages: [] }));

        expect(resourceSpy.mock.calls.map((call) => call[0])).toEqual(['user-details']);
        expect(promptSpy.mock.calls.map((call) => call[0])).toEqual(['user_audit']);
    });

    it('forwards non-gated members with the target as receiver', () => {
        class PrivateFieldHost {
            #secret = 'kept';

            get secret() {
                return this.#secret;
            }

            tool(_name: string) {
                return this;
            }
        }

        const host = new PrivateFieldHost();
        const gated = restrictToSupport(host as unknown as McpServer) as unknown as PrivateFieldHost;

        // Reading a #private field through a proxy throws unless the get trap
        // forwards `target` as the receiver when invoking property getters.
        expect((gated as unknown as { secret: string }).secret).toBe('kept');
    });
});
