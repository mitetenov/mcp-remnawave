import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemnawaveClient } from '../src/client/index.js';

function createClient(overrides?: { baseUrl?: string; apiToken?: string; apiKey?: string }): RemnawaveClient {
    return new RemnawaveClient({
        baseUrl: overrides?.baseUrl ?? 'https://panel.example.com',
        apiToken: overrides?.apiToken ?? 'test-token',
        apiKey: overrides?.apiKey,
        readonly: false,
    });
}

function mockFetch(response: unknown, status = 200) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        json: vi.fn().mockResolvedValue(response),
    });
}

describe('RemnawaveClient', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('sets authorization header', () => {
            const client = createClient();
            expect(client).toBeDefined();
        });

        it('sets X-Api-Key header when apiKey is provided', () => {
            const client = createClient({ apiKey: 'secret-key' });
            expect(client).toBeDefined();
        });
    });

    describe('user methods', () => {
        it('getUsers constructs correct URL with pagination defaults', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUsers();

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/users/?start=0&size=25',
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUsers constructs correct URL with custom pagination', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUsers(10, 50);

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/users/?start=10&size=50',
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserByUuid constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserByUuid('abc-123');

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/users/abc-123',
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('createUser sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.createUser({
                username: 'testuser',
                expireAt: new Date('2025-12-31'),
                status: 'ACTIVE',
            });

            const [url, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(url).toBe('https://panel.example.com/api/users/');
            expect(options.method).toBe('POST');
            const body = JSON.parse(options.body as string);
            expect(body.username).toBe('testuser');
            expect(body.status).toBe('ACTIVE');
        });

        it('deleteUser constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.deleteUser('abc-123');

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/users/abc-123',
                expect.objectContaining({ method: 'DELETE' }),
            );
        });

        it('resolveUsers sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.resolveUsers({ uuid: 'abc', username: 'test' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.uuid).toBe('abc');
            expect(body.username).toBe('test');
        });
    });

    describe('host methods', () => {
        it('createHost sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.createHost({
                remark: 'my-host',
                address: '1.2.3.4',
                port: 443,
                inbound: {
                    configProfileUuid: 'profile-uuid',
                    configProfileInboundUuid: 'inbound-uuid',
                },
            });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.remark).toBe('my-host');
            expect(body.address).toBe('1.2.3.4');
            expect(body.port).toBe(443);
            expect(body.inbound.configProfileUuid).toBe('profile-uuid');
        });
    });

    describe('node methods', () => {
        it('reorderNodes sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.reorderNodes([
                { viewPosition: 0, uuid: 'node-1' },
                { viewPosition: 1, uuid: 'node-2' },
            ]);

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.nodes).toEqual([
                { viewPosition: 0, uuid: 'node-1' },
                { viewPosition: 1, uuid: 'node-2' },
            ]);
        });
    });

    describe('error handling', () => {
        it('throws on non-ok response', async () => {
            const client = createClient();
            const fetch = mockFetch({ message: 'not found' }, 404);
            vi.stubGlobal('fetch', fetch);

            await expect(client.getUserByUuid('missing')).rejects.toThrow(
                'Remnawave API error: not found',
            );
        });

        it('throws on network error', async () => {
            const client = createClient();
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

            await expect(client.getUsers()).rejects.toThrow('network down');
        });
    });

    describe('system methods', () => {
        it('getStats calls correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({ users: 100, nodes: 5 });
            vi.stubGlobal('fetch', fetch);

            await client.getStats();

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/system/stats',
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getHealth calls correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({ status: 'ok' });
            vi.stubGlobal('fetch', fetch);

            await client.getHealth();

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/system/health',
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('generateX25519 calls correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({ privateKey: '...', publicKey: '...' });
            vi.stubGlobal('fetch', fetch);

            await client.generateX25519();

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/system/tools/x25519/generate',
                expect.objectContaining({ method: 'GET' }),
            );
        });
    });

    describe('billing methods', () => {
        it('createBillingProvider sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.createBillingProvider({
                name: 'MyProvider',
                faviconLink: 'https://example.com/favicon.ico',
                loginUrl: 'https://example.com/login',
            });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.name).toBe('MyProvider');
            expect(body.faviconLink).toBe('https://example.com/favicon.ico');
        });
    });

    describe('squad methods', () => {
        it('addUsersToSquad sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.addUsersToSquad('squad-uuid', ['user-1', 'user-2']);

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.userUuids).toEqual(['user-1', 'user-2']);
        });
    });

    describe('IP control methods', () => {
        it('dropConnections sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.dropConnections({
                dropBy: {
                    by: 'ipAddresses',
                    ipAddresses: ['10.0.0.1'],
                },
                targetNodes: {
                    target: 'allNodes',
                },
            });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.dropBy.by).toBe('ipAddresses');
            expect(body.targetNodes.target).toBe('allNodes');
        });
    });
});
