import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemnawaveClient } from '../src/client/index.js';

function createClient(overrides?: { baseUrl?: string; apiToken?: string; apiKey?: string }): RemnawaveClient {
    return new RemnawaveClient({
        baseUrl: overrides?.baseUrl ?? 'https://panel.example.com',
        apiToken: overrides?.apiToken ?? 'test-token',
        apiKey: overrides?.apiKey,
        isSupport: false,
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
            const client = createClient({ apiKey: 'my-api-key' });
            expect(client).toBeDefined();
        });
    });

    // ── User Methods ──────────────────────────────────────────────

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

        it('getUserById constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserById(42);

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/users/42',
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserByUsername constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserByUsername('testuser');

            const [url] = fetch.mock.calls[0] as [string];
            expect(url).toContain('/api/users/by-username/testuser');
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/by-username/testuser'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserByShortUuid constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserByShortUuid('short-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/by-short-uuid/short-1'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserAccessibleNodes constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserAccessibleNodes(42);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/42/accessible-nodes'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserTags constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserTags();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/tags'),
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

        it('updateUser sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.updateUser({ uuid: 'abc', username: 'new-name', status: 'DISABLED' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PATCH');
            const body = JSON.parse(options.body as string);
            expect(body.uuid).toBe('abc');
            expect(body.username).toBe('new-name');
        });

        it('deleteUser constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.deleteUser(42);

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/users/42',
                expect.objectContaining({ method: 'DELETE' }),
            );
        });

        it('enableUser sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.enableUser(42);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/42/actions/enable'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('disableUser sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.disableUser(42);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/42/actions/disable'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('revokeUserSubscription sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.revokeUserSubscription(42);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/42/actions/revoke'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('resetUserTraffic sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.resetUserTraffic(42);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/42/actions/reset-traffic'),
                expect.objectContaining({ method: 'POST' }),
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

        it('bulkDeleteUsersByStatus sends correct request', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkDeleteUsersByStatus({ status: 'EXPIRED' });

            const [url, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(url).toContain('/api/users/bulk/delete-by-status');
            expect(options.method).toBe('POST');
            const body = JSON.parse(options.body as string);
            expect(body.status).toBe('EXPIRED');
        });

        it('bulkUpdateUsers sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkUpdateUsers({ uuids: ['a', 'b'], fields: { status: 'DISABLED' } });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('POST');
            const body = JSON.parse(options.body as string);
            expect(body.uuids).toEqual(['a', 'b']);
            expect(body.fields.status).toBe('DISABLED');
        });

        it('bulkResetUsersTraffic correctly sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkResetUsersTraffic({ uuids: ['a', 'b'] });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/bulk/reset-traffic'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('bulkDeleteUsers correctly sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkDeleteUsers({ uuids: ['a', 'b'] });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/bulk/delete'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('bulkAllUpdateUsers sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkAllUpdateUsers({ status: 'DISABLED' });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/bulk/all/update'),
                expect.objectContaining({ method: 'POST' }),
            );
        });
    });

    // ── Node Methods ──────────────────────────────────────────────

    describe('node methods', () => {
        it('getNodes constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getNodes();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/nodes'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getNodeByUuid constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getNodeByUuid('node-1');

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/nodes/node-1',
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getNodeTags constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getNodeTags();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/nodes/tags'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('createNode sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.createNode({
                name: 'node-1',
                address: '10.0.0.1',
                configProfile: {
                    activeConfigProfileUuid: 'profile-uuid',
                    activeInbounds: ['inbound-1'],
                },
            });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('POST');
            const body = JSON.parse(options.body as string);
            expect(body.name).toBe('node-1');
            expect(body.address).toBe('10.0.0.1');
            expect(body.configProfile.activeConfigProfileUuid).toBe('profile-uuid');
        });
        it('updateNode sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.updateNode({ uuid: 'node-1', name: 'new-name' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PATCH');
            const body = JSON.parse(options.body as string);
            expect(body.uuid).toBe('node-1');
            expect(body.name).toBe('new-name');
        });

        it('deleteNode sends DELETE', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.deleteNode('node-1');

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/nodes/node-1',
                expect.objectContaining({ method: 'DELETE' }),
            );
        });

        it('enableNode sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.enableNode('node-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/nodes/node-1/actions/enable'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('disableNode sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.disableNode('node-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/nodes/node-1/actions/disable'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

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

        it('restartNode sends POST with forceRestart in the body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.restartNode('node-1', false);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/nodes/node-1/actions/restart'),
                expect.objectContaining({ method: 'POST' }),
            );
            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.forceRestart).toBe(false);
        });

        it('restartNode with forceRestart true sends body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.restartNode('node-1', true);

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.forceRestart).toBe(true);
        });

        it('restartAllNodes sends POST with forceRestart in the body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.restartAllNodes(false);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/nodes/actions/restart-all'),
                expect.objectContaining({ method: 'POST' }),
            );
            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.forceRestart).toBe(false);
        });

        it('restartAllNodes with forceRestart true sends body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.restartAllNodes(true);

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.forceRestart).toBe(true);
        });

        it('createNode sends new 2.8 fields (nodeConsumptionMultiplier, note, proxyUrl)', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.createNode({
                name: 'node-1',
                address: '10.0.0.1',
                activeConfigProfileUuid: 'profile-uuid',
                activeInbounds: ['inbound-1'],
                nodeConsumptionMultiplier: 1.5,
                note: 'my node note',
                proxyUrl: 'socks5://proxy.example.com:1080',
            });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.nodeConsumptionMultiplier).toBe(1.5);
            expect(body.note).toBe('my node note');
            expect(body.proxyUrl).toBe('socks5://proxy.example.com:1080');
        });

        it('resetNodeTraffic sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.resetNodeTraffic('node-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/nodes/node-1/actions/reset-traffic'),
                expect.objectContaining({ method: 'POST' }),
            );
        });
    });

    // ── Host Methods ──────────────────────────────────────────────

    describe('host methods', () => {
        it('getHosts constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getHosts();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/hosts'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getHostByUuid constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getHostByUuid('host-1');

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/hosts/host-1',
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getHostTags constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getHostTags();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/hosts/tags'),
                expect.objectContaining({ method: 'GET' }),
            );
        });
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

        it('createHost sends new 2.8 fields (tags, mihomoIpVersion, pinnedPeerCertSha256, verifyPeerCertByName)', async () => {
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
                tags: ['tag1', 'tag2'],
                mihomoIpVersion: 'dual',
                pinnedPeerCertSha256: 'abc123',
                verifyPeerCertByName: true,
            });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.tags).toEqual(['tag1', 'tag2']);
            expect(body.mihomoIpVersion).toBe('dual');
            expect(body.pinnedPeerCertSha256).toBe('abc123');
            expect(body.verifyPeerCertByName).toBe(true);
        });

        it('updateHost sends PATCH with correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.updateHost({ uuid: 'host-1', remark: 'updated-host', port: 8443 });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PATCH');
            const body = JSON.parse(options.body as string);
            expect(body.uuid).toBe('host-1');
            expect(body.remark).toBe('updated-host');
        });

        it('deleteHost sends DELETE', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.deleteHost('host-1');

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/hosts/host-1',
                expect.objectContaining({ method: 'DELETE' }),
            );
        });

        it('bulkEnableHosts sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkEnableHosts({ uuids: ['a', 'b'] });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/hosts/bulk/enable'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('bulkDisableHosts sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkDisableHosts({ uuids: ['a'] });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.uuids).toEqual(['a']);
        });

        it('bulkSetHostInbound sends PATCH with correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkSetHostInbound({
                uuids: ['a'],
                configProfileUuid: 'prof-1',
                configProfileInboundUuid: 'inb-1',
            });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PATCH');
            const body = JSON.parse(options.body as string);
            expect(body.uuids).toEqual(['a']);
            expect(body.configProfileUuid).toBe('prof-1');
        });

        it('bulkSetHostPort sends PATCH with correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkSetHostPort({ uuids: ['a'], port: 8443 });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PATCH');
            const body = JSON.parse(options.body as string);
            expect(body.uuids).toEqual(['a']);
            expect(body.port).toBe(8443);
        });
    });

    // ── Subscription Methods ──────────────────────────────────────

    describe('subscription methods', () => {
        it('getSubscriptions constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getSubscriptions();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/subscriptions/?start=0&size=25'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getSubscriptionByUserId constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getSubscriptionByUserId(7);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/subscriptions/by-id/7'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getSubscriptionByUsername constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getSubscriptionByUsername('testuser');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/subscriptions/by-username/testuser'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getConnectionKeysByUserId constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getConnectionKeysByUserId(7);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/subscriptions/connection-keys/7'),
                expect.objectContaining({ method: 'GET' }),
            );
        });
    });

    // ── System Methods ────────────────────────────────────────────

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

        it('getBandwidthStats calls correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getBandwidthStats();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/system/stats/bandwidth'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getStatsDigest sends the required start and end query parameters', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getStatsDigest({
                start: '2026-07-15T00:00:00Z',
                end: '2026-07-16T00:00:00Z',
            });

            const [url] = fetch.mock.calls[0] as [string];
            expect(url).toContain('/api/system/stats/digest');
            expect(url).toContain('start=2026-07-15T00%3A00%3A00Z');
            expect(url).toContain('end=2026-07-16T00%3A00%3A00Z');
        });
    });

    // ── Config Profile / Inbound Methods ──────────────────────────

    describe('config profile methods', () => {
        it('getConfigProfiles constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getConfigProfiles();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/config-profiles'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getAllInbounds constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getAllInbounds();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/config-profiles/inbounds'),
                expect.objectContaining({ method: 'GET' }),
            );
        });
    });

    // ── Squad Methods ─────────────────────────────────────────────

    describe('squad methods', () => {
        it('getInternalSquads constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getInternalSquads();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/internal-squads'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('addManyUsersToSquad sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.addManyUsersToSquad('squad-uuid', { userIds: [1, 2] });

            const [url, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(url).toContain('/api/internal-squads/squad-uuid/bulk-actions/add-many-users');
            const body = JSON.parse(options.body as string);
            expect(body.userIds).toEqual([1, 2]);
        });

        it('removeManyUsersFromSquad sends a DELETE with correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.removeManyUsersFromSquad('squad-uuid', { userIds: [1] });

            const [url, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(url).toContain('/api/internal-squads/squad-uuid/bulk-actions/remove-many-users');
            expect(options.method).toBe('DELETE');
            const body = JSON.parse(options.body as string);
            expect(body.userIds).toEqual([1]);
        });

        it('addAllUsersToSquad sends POST without a body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.addAllUsersToSquad('squad-uuid');

            const [url, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(url).toContain('/api/internal-squads/squad-uuid/bulk-actions/add-users');
            expect(options.method).toBe('POST');
            expect(options.body).toBeUndefined();
        });
    });

    // ── HWID Methods ──────────────────────────────────────────────

    describe('hwid methods', () => {
        it('getUserHwidDevices constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserHwidDevices(7);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/hwid/devices/7'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getAllHwidDevices constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getAllHwidDevices();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/hwid/devices'),
                expect.objectContaining({ method: 'GET' }),
            );
        });
    });

    // ── API Token Methods ─────────────────────────────────────────

    describe('api token methods', () => {
        it('getApiTokens constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getApiTokens();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/tokens'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('createApiToken sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.createApiToken({ name: 'test-token' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('POST');
        });

        it('deleteApiToken sends DELETE', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.deleteApiToken('token-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/tokens/token-1'),
                expect.objectContaining({ method: 'DELETE' }),
            );
        });
    });

    // ── Keygen Methods ────────────────────────────────────────────

    describe('keygen methods', () => {
        it('getKeygen constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getKeygen();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/keygen'),
                expect.objectContaining({ method: 'GET' }),
            );
        });
    });

    // ── Billing Methods ───────────────────────────────────────────

    describe('billing methods', () => {
        it('getBillingProviders constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getBillingProviders();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/infra-billing/providers'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

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

        it('deleteBillingProvider sends DELETE', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.deleteBillingProvider('prov-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/infra-billing/providers/prov-1'),
                expect.objectContaining({ method: 'DELETE' }),
            );
        });
    });

    // ── Snippet Methods ───────────────────────────────────────────

    describe('snippet methods', () => {
        it('getSnippets constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getSnippets();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/snippets'),
                expect.objectContaining({ method: 'GET' }),
            );
        });
    });

    // ── External Squad Methods ────────────────────────────────────

    describe('external squad methods', () => {
        it('getExternalSquads constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getExternalSquads();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/external-squads'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('addAllUsersToExternalSquad sends POST without a body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.addAllUsersToExternalSquad('squad-uuid');

            const [url, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(url).toContain('/api/external-squads/squad-uuid/bulk-actions/add-users');
            expect(options.method).toBe('POST');
            expect(options.body).toBeUndefined();
        });
    });

    // ── Settings Methods ──────────────────────────────────────────

    describe('settings methods', () => {
        it('getSettings constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getSettings();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/remnawave-settings'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('updateSettings sends PATCH', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.updateSettings({ someSetting: 'value' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PATCH');
        });
    });

    // ── Subscription Page Config Methods ──────────────────────────

    describe('subscription page config methods', () => {
        it('getSubscriptionPageConfigs constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getSubscriptionPageConfigs();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/subscription-page-configs'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('cloneSubscriptionPageConfig sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.cloneSubscriptionPageConfig({ uuid: 'cfg-1', name: 'clone' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('POST');
        });
    });

    // ── Node Plugin Methods ───────────────────────────────────────

    describe('node plugin methods', () => {
        it('getNodePlugins constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getNodePlugins();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/node-plugins'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('executeNodePlugin sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.executeNodePlugin({ nodePluginUuid: 'plugin-1', action: 'run' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('POST');
        });
    });

    // ── Torrent Blocker Methods ───────────────────────────────────

    describe('torrent blocker methods', () => {
        it('getTorrentBlockerReports constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getTorrentBlockerReports();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/node-plugins/torrent-blocker'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('truncateTorrentBlockerReports sends DELETE', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.truncateTorrentBlockerReports();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/node-plugins/torrent-blocker/truncate'),
                expect.objectContaining({ method: 'DELETE' }),
            );
        });
    });

    // ── IP Control Methods ────────────────────────────────────────

    describe('connections methods', () => {
        it('dropConnections sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.dropConnections({
                dropBy: {
                    by: 'userIds',
                    userIds: [7],
                },
                targetNodes: {
                    target: 'allNodes',
                },
            });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.dropBy.by).toBe('userIds');
            expect(body.targetNodes.target).toBe('allNodes');
        });

        it('connectionsByUser sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.connectionsByUser(7);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/connections/by-user/7'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('connectionsByUserResult sends GET', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.connectionsByUserResult('job-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/connections/by-user/job-1'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('dropConnections targets the connections controller', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.dropConnections({
                dropBy: { by: 'ipAddresses', ipAddresses: ['10.0.0.1'] },
                targetNodes: { target: 'allNodes' },
            });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/connections/drop'),
                expect.objectContaining({ method: 'POST' }),
            );
        });
    });

    // ── Metadata Methods ──────────────────────────────────────────

    describe('metadata methods', () => {
        it('getNodeMetadata constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getNodeMetadata('node-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/metadata/node/node-1'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('upsertNodeMetadata sends PUT with the body wrapped in a metadata field', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.upsertNodeMetadata('node-1', { key: 'value' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PUT');
            const body = JSON.parse(options.body as string);
            expect(body).toEqual({ metadata: { key: 'value' } });
        });

        it('getUserMetadata constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserMetadata(7);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/metadata/user/7'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('upsertUserMetadata sends PUT with the body wrapped in a metadata field', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.upsertUserMetadata(7, { region: 'eu' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PUT');
            const body = JSON.parse(options.body as string);
            expect(body).toEqual({ metadata: { region: 'eu' } });
        });
    });

    // ── Bandwidth Stats Methods ───────────────────────────────────

    describe('bandwidth stats methods', () => {
        it('getNodesBandwidth constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getNodesBandwidth({ start: '2026-07-01', end: '2026-07-31' });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/bandwidth-stats/nodes'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getNodesBandwidth sends the required start and end query parameters', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getNodesBandwidth({ start: '2026-07-01', end: '2026-07-31' });

            const [url] = fetch.mock.calls[0] as [string];
            expect(url).toContain('start=2026-07-01');
            expect(url).toContain('end=2026-07-31');
        });

        it('getNodesRealtimeBandwidth constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getNodesRealtimeBandwidth();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/bandwidth-stats/nodes/realtime'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserBandwidthByUserId constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserBandwidthByUserId(7, { start: '2026-07-01', end: '2026-07-31' });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/bandwidth-stats/users/7'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserBandwidthByUserId sends the required start and end query parameters', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserBandwidthByUserId(7, { start: '2026-07-01', end: '2026-07-31' });

            const [url] = fetch.mock.calls[0] as [string];
            expect(url).toContain('start=2026-07-01');
            expect(url).toContain('end=2026-07-31');
        });
    });

    // ── Auth Methods ──────────────────────────────────────────────

    describe('auth methods', () => {
        it('getAuthStatus constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({ status: 'authenticated' });
            vi.stubGlobal('fetch', fetch);

            await client.getAuthStatus();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/auth/status'),
                expect.objectContaining({ method: 'GET' }),
            );
        });
    });

    // ── Error Handling ────────────────────────────────────────────

    describe('error handling', () => {
        it('throws on non-ok response', async () => {
            const client = createClient();
            const fetch = mockFetch({ message: 'not found' }, 404);
            vi.stubGlobal('fetch', fetch);

            await expect(client.getUserById(404)).rejects.toThrow(
                'Remnawave API error: not found',
            );
        });

        it('throws on network error', async () => {
            const client = createClient();
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

            await expect(client.getUsers()).rejects.toThrow('network down');
        });

        it('handles non-JSON error response', async () => {
            const client = createClient();
            const fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            });
            vi.stubGlobal('fetch', fetch);

            await expect(client.getUsers()).rejects.toThrow(
                'Remnawave API error: HTTP 500 Internal Server Error',
            );
        });

        it('throws when client is not configured', async () => {
            const client = new RemnawaveClient({
                baseUrl: '',
                apiToken: '',
                isSupport: false,
            });

            await expect(client.getUsers()).rejects.toThrow(
                'MCP server is not configured',
            );
        });
    });

    // ── Configuration mode test ───────────────────────────────────

    describe('API key auth', () => {
        it('uses X-Api-Key header when apiKey is configured', async () => {
            const client = createClient({ apiKey: 'my-key-123' });
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUsers();

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const headers = options.headers as Record<string, string>;
            expect(headers['X-Api-Key']).toBe('my-key-123');
            expect(headers['Authorization']).toBe('Bearer test-token');
        });
    });

    describe('support-mode redaction', () => {
        const userPayload = () => ({
            response: {
                users: [
                    {
                        id: 1,
                        username: 'vasya',
                        trojanPassword: 'trojan-secret',
                        ssPassword: 'ss-secret',
                        vlessUuid: '11111111-2222-3333-4444-555555555555',
                        subscriptionUrl: 'https://panel.example.com/sub/abc',
                        userTraffic: { usedTrafficBytes: 1, vlessUuid: 'nested-secret' },
                    },
                ],
            },
        });

        it('strips credentials from nested objects and arrays', async () => {
            const client = new RemnawaveClient({
                baseUrl: 'https://panel.example.com',
                apiToken: 'test-token',
                isSupport: true,
            });
            vi.stubGlobal('fetch', mockFetch(userPayload()));

            const result = (await client.getUserById(1)) as Record<string, any>;
            const user = result.response.users[0];

            expect(user.trojanPassword).toBeUndefined();
            expect(user.ssPassword).toBeUndefined();
            expect(user.vlessUuid).toBeUndefined();
            expect(user.userTraffic.vlessUuid).toBeUndefined();
            expect(user.userTraffic.usedTrafficBytes).toBe(1);
        });

        it('keeps the subscription url', async () => {
            const client = new RemnawaveClient({
                baseUrl: 'https://panel.example.com',
                apiToken: 'test-token',
                isSupport: true,
            });
            vi.stubGlobal('fetch', mockFetch(userPayload()));

            const result = (await client.getUserById(1)) as Record<string, any>;

            expect(result.response.users[0].subscriptionUrl).toBe(
                'https://panel.example.com/sub/abc',
            );
        });

        it('redacts nothing in full mode', async () => {
            const client = new RemnawaveClient({
                baseUrl: 'https://panel.example.com',
                apiToken: 'test-token',
                isSupport: false,
            });
            vi.stubGlobal('fetch', mockFetch(userPayload()));

            const result = (await client.getUserById(1)) as Record<string, any>;

            expect(result.response.users[0].trojanPassword).toBe('trojan-secret');
            expect(result.response.users[0].userTraffic.vlessUuid).toBe('nested-secret');
        });

        it('strips links and ssConfLinks from a SubscriptionInfoSchema-shaped payload, keeps subscriptionUrl', async () => {
            const client = new RemnawaveClient({
                baseUrl: 'https://panel.example.com',
                apiToken: 'test-token',
                isSupport: true,
            });
            const subscriptionInfoPayload = {
                isFound: true,
                user: { username: 'vasya', shortUuid: 'abc-123' },
                links: [
                    'vless://11111111-2222-3333-4444-555555555555@host:443?type=tcp',
                ],
                ssConfLinks: {
                    default: 'ss://base64-payload-with-ss-secret@host:443',
                },
                subscriptionUrl: 'https://panel.example.com/sub/abc',
            };
            vi.stubGlobal('fetch', mockFetch(subscriptionInfoPayload));

            const result = (await client.getSubscriptionInfo('abc-123')) as Record<
                string,
                any
            >;

            expect(result.links).toBeUndefined();
            expect(result.ssConfLinks).toBeUndefined();
            expect(result.subscriptionUrl).toBe(
                'https://panel.example.com/sub/abc',
            );
            expect(result.isFound).toBe(true);
            expect(result.user).toEqual({ username: 'vasya', shortUuid: 'abc-123' });
        });
    });
});
