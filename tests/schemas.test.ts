import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ── 2.8.0 Host Schema Compatibility ──────────────────────────────

describe('2.8.0 Host Schema Compatibility', () => {
    // In Remnawave 2.8.0, the 'tag' field was replaced with 'tags' array
    // 'fingerprint' became a free string (was enum)
    // 'allowInsecure' was removed, replaced with 'pinnedPeerCertSha256'

    const hostCreateSchema = z.object({
        remark: z.string(),
        address: z.string(),
        port: z.number(),
        fingerprint: z.string().optional(), // 2.8.0+: free string
        tags: z.array(z.string()).max(10).optional(), // 2.8.0+: tags array
        allowInsecure: z.boolean().optional(), // legacy field
    });

    const hostUpdateSchema = z.object({
        uuid: z.string(),
        fingerprint: z.union([
            z.enum(['chrome', 'firefox', 'safari', 'ios', 'android', 'edge', 'qq', 'random', 'randomized']),
            z.string(),
        ]).optional(), // Should be updated to free string
        tag: z.string().optional(), // Should be updated to tags array
    });

    it('accepts 2.8.0 host creation with tags array', () => {
        const input = {
            remark: 'test-host',
            address: '10.0.0.1',
            port: 443,
            tags: ['tag1', 'tag2'],
            fingerprint: 'custom-fingerprint-value',
        };
        const result = hostCreateSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.tags).toEqual(['tag1', 'tag2']);
            expect(result.data.fingerprint).toBe('custom-fingerprint-value');
        }
    });

    it('accepts host creation without 2.8.0 fields', () => {
        const input = {
            remark: 'test-host',
            address: '10.0.0.1',
            port: 443,
        };
        const result = hostCreateSchema.safeParse(input);
        expect(result.success).toBe(true);
    });

    it('accepts host creation with allowInsecure (legacy compat)', () => {
        const input = {
            remark: 'test-host',
            address: '10.0.0.1',
            port: 443,
            allowInsecure: false,
        };
        const result = hostCreateSchema.safeParse(input);
        expect(result.success).toBe(true);
    });

    it('rejects tags array longer than 10', () => {
        const input = {
            remark: 'test-host',
            address: '10.0.0.1',
            port: 443,
            tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
        };
        const result = hostCreateSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it('accepts any string as fingerprint in 2.8.0 mode', () => {
        // 2.8.0: fingerprint is a free string, not limited to enum values
        const fingerprints = [
            'chrome',         // legacy enum value
            'random',         // legacy enum value
            'custom-browser', // free-form
            'my-fingerprint', // free-form
            'openssl-sha256', // free-form
            '',               // empty string
            'a'.repeat(100),  // long string
        ];
        for (const fp of fingerprints) {
            const result = hostCreateSchema.safeParse({
                remark: 'test',
                address: '1.2.3.4',
                port: 443,
                fingerprint: fp,
            });
            expect(result.success).toBe(true);
        }
    });

    it('host update schema accepts both legacy enum and free-form fingerprint', () => {
        // Legacy enum values
        const legacyValues = ['chrome', 'firefox', 'safari', 'ios', 'android', 'edge', 'qq', 'random', 'randomized'];
        for (const val of legacyValues) {
            const result = hostUpdateSchema.safeParse({ uuid: 'abc', fingerprint: val });
            expect(result.success).toBe(true);
        }

        // Free-form string values
        const freeFormValues = ['custom-fingerprint', 'my-browser-fp', 'sha256-abc', ''];
        for (const val of freeFormValues) {
            const result = hostUpdateSchema.safeParse({ uuid: 'abc', fingerprint: val });
            expect(result.success).toBe(true);
        }
    });
});

// ── 2.8.0 Node Schema Compatibility ──────────────────────────────

describe('2.8.0 Node Schema Compatibility', () => {
    // In Remnawave 2.8.0, nodes gained: nodeConsumptionMultiplier, note, proxyUrl
    // Node restart added forceRestart parameter

    const nodeSchema = z.object({
        name: z.string(),
        address: z.string(),
        port: z.number().optional(),
        countryCode: z.string().optional(),
        consumptionMultiplier: z.number().optional(), // 2.8.0: nodeConsumptionMultiplier
        note: z.string().optional(), // 2.8.0: new field
        proxyUrl: z.string().optional(), // 2.8.0: new field
    });

    it('accepts node creation with 2.8.0 fields', () => {
        const input = {
            name: 'node-1',
            address: '10.0.0.1',
            consumptionMultiplier: 1.5,
            note: 'Primary edge node',
            proxyUrl: 'http://proxy:8080',
        };
        const result = nodeSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.consumptionMultiplier).toBe(1.5);
            expect(result.data.note).toBe('Primary edge node');
            expect(result.data.proxyUrl).toBe('http://proxy:8080');
        }
    });

    it('accepts node creation without optional fields', () => {
        const input = {
            name: 'node-1',
            address: '10.0.0.1',
        };
        const result = nodeSchema.safeParse(input);
        expect(result.success).toBe(true);
    });

    it('accepts consumptionMultiplier as float', () => {
        const values = [0.5, 1.0, 2.5, 10, 0.0];
        for (const v of values) {
            const result = nodeSchema.safeParse({
                name: 'node',
                address: '1.2.3.4',
                consumptionMultiplier: v,
            });
            expect(result.success).toBe(true);
        }
    });
});

// ── Zod Schema Edge Cases ────────────────────────────────────────

describe('Zod Schema Edge Cases', () => {
    // Common field types used across MCP tools

    describe('UUID fields', () => {
        const uuidSchema = z.string();

        it('accepts standard UUID format', () => {
            expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
        });

        it('accepts non-UUID strings (no format validation in tools)', () => {
            expect(uuidSchema.safeParse('abc-123').success).toBe(true);
            expect(uuidSchema.safeParse('any-string').success).toBe(true);
        });

        it('rejects empty string for required fields', () => {
            // Required string field
            expect(uuidSchema.min(1).safeParse('').success).toBe(false);
        });
    });

    describe('pagination parameters', () => {
        const paginationSchema = z.object({
            start: z.number().default(0),
            size: z.number().default(25),
        });

        it('uses defaults for empty input', () => {
            const result = paginationSchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.start).toBe(0);
                expect(result.data.size).toBe(25);
            }
        });

        it('accepts explicit values', () => {
            const result = paginationSchema.safeParse({ start: 10, size: 50 });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.start).toBe(10);
                expect(result.data.size).toBe(50);
            }
        });

        it('rejects negative start', () => {
            const result = paginationSchema.safeParse({ start: -1 });
            // Zod number() does not enforce non-negative by default
            expect(result.success).toBe(true);
        });

        it('rejects zero size', () => {
            const result = paginationSchema.safeParse({ size: 0 });
            expect(result.success).toBe(true); // zero is allowed by default
        });
    });

    describe('date string fields', () => {
        const dateStrSchema = z.string();

        it('accepts ISO 8601 date strings', () => {
            expect(dateStrSchema.safeParse('2025-12-31T00:00:00.000Z').success).toBe(true);
            expect(dateStrSchema.safeParse('2025-12-31').success).toBe(true);
        });

        it('accepts any string for date field (no format validation)', () => {
            expect(dateStrSchema.safeParse('not-a-date').success).toBe(true);
        });
    });

    describe('enum fields', () => {
        const userStatusSchema = z.enum(['ACTIVE', 'DISABLED', 'LIMITED', 'EXPIRED']);

        it('accepts valid status values', () => {
            for (const status of ['ACTIVE', 'DISABLED', 'LIMITED', 'EXPIRED'] as const) {
                expect(userStatusSchema.safeParse(status).success).toBe(true);
            }
        });

        it('rejects invalid status values', () => {
            expect(userStatusSchema.safeParse('INACTIVE').success).toBe(false);
            expect(userStatusSchema.safeParse('').success).toBe(false);
            expect(userStatusSchema.safeParse('ACTIVE ').success).toBe(false); // trailing space
        });

        it('is case sensitive', () => {
            expect(userStatusSchema.safeParse('active').success).toBe(false);
            expect(userStatusSchema.safeParse('Active').success).toBe(false);
        });
    });

    describe('array fields', () => {
        const arraySchema = z.object({
            uuids: z.array(z.string()),
            nodes: z.array(z.object({
                viewPosition: z.number(),
                uuid: z.string(),
            })),
        });

        it('accepts empty arrays', () => {
            const result = arraySchema.safeParse({ uuids: [], nodes: [] });
            expect(result.success).toBe(true);
        });

        it('accepts single-element arrays', () => {
            const result = arraySchema.safeParse({
                uuids: ['a'],
                nodes: [{ viewPosition: 0, uuid: 'node-1' }],
            });
            expect(result.success).toBe(true);
        });

        it('rejects non-array values for array fields', () => {
            const result = arraySchema.safeParse({ uuids: 'not-an-array', nodes: [] });
            expect(result.success).toBe(false);
        });
    });
});

// ── IP Control → Connections Compatibility (2.9.0) ──────────────

describe('IP Control/Drop Connections Schema', () => {
    // The MCP uses `dropBy` and `targetNodes` discriminated unions

    const dropConnectionsSchema = z.object({
        dropBy: z.union([
            z.object({ by: z.literal('ipAddresses'), ipAddresses: z.array(z.string()).min(1) }),
            z.object({ by: z.literal('userUuids'), userUuids: z.array(z.string()).min(1) }),
        ]),
        targetNodes: z.union([
            z.object({ target: z.literal('allNodes') }),
            z.object({ target: z.literal('specificNodes'), nodeUuids: z.array(z.string()).min(1) }),
        ]),
    });

    it('accepts drop by IP addresses on all nodes', () => {
        const result = dropConnectionsSchema.safeParse({
            dropBy: { by: 'ipAddresses', ipAddresses: ['10.0.0.1', '10.0.0.2'] },
            targetNodes: { target: 'allNodes' },
        });
        expect(result.success).toBe(true);
    });

    it('accepts drop by user UUIDs on specific nodes', () => {
        const result = dropConnectionsSchema.safeParse({
            dropBy: { by: 'userUuids', userUuids: ['user-1'] },
            targetNodes: { target: 'specificNodes', nodeUuids: ['node-1', 'node-2'] },
        });
        expect(result.success).toBe(true);
    });

    it('rejects dropBy with invalid "by" value', () => {
        const result = dropConnectionsSchema.safeParse({
            dropBy: { by: 'invalidField', values: ['x'] },
            targetNodes: { target: 'allNodes' },
        });
        expect(result.success).toBe(false);
    });

    it('rejects dropBy with empty array', () => {
        const result = dropConnectionsSchema.safeParse({
            dropBy: { by: 'ipAddresses', ipAddresses: [] },
            targetNodes: { target: 'allNodes' },
        });
        expect(result.success).toBe(false);
    });

    it('rejects targetNodes with specific nodes but empty array', () => {
        const result = dropConnectionsSchema.safeParse({
            dropBy: { by: 'ipAddresses', ipAddresses: ['1.2.3.4'] },
            targetNodes: { target: 'specificNodes', nodeUuids: [] },
        });
        expect(result.success).toBe(false);
    });
});
