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

        it('getUserByTelegramId constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserByTelegramId('12345');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/by-telegram-id/12345'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserByEmail constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserByEmail('user@example.com');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/by-email/user@example.com'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserByTag constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserByTag('vip');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/by-tag/vip'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserById constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserById('42');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/by-id/42'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('getUserBySubscriptionUuid constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserBySubscriptionUuid('sub-uuid-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/by-subscription-uuid/sub-uuid-1'),
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

            await client.deleteUser('abc-123');

            expect(fetch).toHaveBeenCalledWith(
                'https://panel.example.com/api/users/abc-123',
                expect.objectContaining({ method: 'DELETE' }),
            );
        });

        it('enableUser sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.enableUser('abc');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/abc/actions/enable'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('disableUser sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.disableUser('abc');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/abc/actions/disable'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('revokeUserSubscription sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.revokeUserSubscription('abc');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/abc/actions/revoke'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('resetUserTraffic sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.resetUserTraffic('abc');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/abc/actions/reset-traffic'),
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

        it('restartNode sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.restartNode('node-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/nodes/node-1/actions/restart'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('restartNode with forceRestart sends body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.restartNode('node-1', true);

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.forceRestart).toBe(true);
        });

        it('restartAllNodes sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.restartAllNodes();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/nodes/actions/restart-all'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('restartAllNodes with forceRestart sends body', async () => {
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

        it('bulkSetHostInbound sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.bulkSetHostInbound({
                uuids: ['a'],
                configProfileUuid: 'prof-1',
                configProfileInboundUuid: 'inb-1',
            });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.uuids).toEqual(['a']);
            expect(body.configProfileUuid).toBe('prof-1');
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

        it('getSubscriptionByUuid constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getSubscriptionByUuid('sub-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/subscriptions/by-uuid/sub-1'),
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

        it('getConnectionKeysByUuid constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getConnectionKeysByUuid('user-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/subscriptions/connection-keys/user-1'),
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

        it('addUsersToSquad sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.addUsersToSquad('squad-uuid', ['user-1', 'user-2']);

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.userUuids).toEqual(['user-1', 'user-2']);
        });

        it('removeUsersFromSquad sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.removeUsersFromSquad('squad-uuid', ['user-1']);

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.userUuids).toEqual(['user-1']);
        });
    });

    // ── HWID Methods ──────────────────────────────────────────────

    describe('hwid methods', () => {
        it('getUserHwidDevices constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserHwidDevices('user-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/hwid/devices/user-1'),
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

        it('addUsersToExternalSquad sends correct body', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.addUsersToExternalSquad('squad-uuid', ['user-1']);

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(options.body as string);
            expect(body.userUuids).toEqual(['user-1']);
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

        it('truncateTorrentBlockerReports sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.truncateTorrentBlockerReports();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/node-plugins/torrent-blocker/truncate'),
                expect.objectContaining({ method: 'POST' }),
            );
        });
    });

    // ── IP Control Methods ────────────────────────────────────────

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

        it('fetchIps sends POST', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.fetchIps('user-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/ip-control/fetch-ips/user-1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('getFetchIpsResult sends GET', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getFetchIpsResult('job-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/ip-control/fetch-ips/result/job-1'),
                expect.objectContaining({ method: 'GET' }),
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

        it('upsertNodeMetadata sends PUT', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.upsertNodeMetadata('node-1', { key: 'value' });

            const [, options] = fetch.mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PUT');
            const body = JSON.parse(options.body as string);
            expect(body.key).toBe('value');
        });

        it('getUserMetadata constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserMetadata('user-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/metadata/user/user-1'),
                expect.objectContaining({ method: 'GET' }),
            );
        });
    });

    // ── Bandwidth Stats Methods ───────────────────────────────────

    describe('bandwidth stats methods', () => {
        it('getNodesBandwidth constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch([]);
            vi.stubGlobal('fetch', fetch);

            await client.getNodesBandwidth();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/bandwidth-stats/nodes'),
                expect.objectContaining({ method: 'GET' }),
            );
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

        it('getUserBandwidthByUuid constructs correct URL', async () => {
            const client = createClient();
            const fetch = mockFetch({});
            vi.stubGlobal('fetch', fetch);

            await client.getUserBandwidthByUuid('user-1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/bandwidth-stats/users/user-1'),
                expect.objectContaining({ method: 'GET' }),
            );
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

            await expect(client.getUserByUuid('missing')).rejects.toThrow(
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
                readonly: false,
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
});
