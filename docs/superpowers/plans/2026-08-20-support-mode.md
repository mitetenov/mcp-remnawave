# Support Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `readonly` flag with `isSupport`, which switches the MCP server between a 13-tool support surface (the default) and unrestricted full access.

**Architecture:** A single `Proxy` wraps the `McpServer` in `createServer` and drops any tool, resource or prompt registration whose name is not in a central allowlist, so the 20 registration modules stay unaware of modes. Credential stripping lives in `RemnawaveClient.request()` — the one point every panel response passes through, including responses that MCP resources read directly.

**Tech Stack:** TypeScript 6, `@modelcontextprotocol/sdk` 1.29, `@remnawave/backend-contract` 3.4.2, zod 4, vitest 4, tsup.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-20-support-mode-design.md`.
- Support mode is the **default**. Full mode requires the exact string `false`: `process.env.REMNAWAVE_IS_SUPPORT !== 'false'`. Never use `=== 'true'`.
- `REMNAWAVE_READONLY` is removed everywhere. No alias, no deprecation shim.
- Release version is **3.0.0** (`package.json`, README both languages, `McpServer` constructor).
- The support tool allowlist is exactly these 13 names, in this spelling:
  `users_resolve`, `users_get`, `users_get_by_username`, `users_get_by_short_uuid`,
  `users_accessible_nodes`, `subscriptions_get_by_user_id`, `subscriptions_get_by_username`,
  `subscriptions_get_by_short_uuid`, `subscription_info`, `bandwidth_user_usage`,
  `hwid_devices_list`, `hwid_device_delete`, `hwid_devices_delete_all`.
- Support resources: `user-details` only. Support prompts: `user_audit` only.
- Redacted fields: `trojanPassword`, `ssPassword`, `vlessUuid`. `subscriptionUrl` is **kept**.
- Full mode registers 178 tools, 4 resources, 5 prompts, and redacts nothing.
- Registration modules must never use the return value of `server.tool` / `.resource` / `.prompt`.
- Indentation is 4 spaces, matching the existing source.
- Run `npx tsc --noEmit` before every commit.

---

### Task 1: `isSupport` config flag

Replaces `Config.readonly` with `Config.isSupport`, parsed fail-closed.

**Files:**
- Modify: `src/config.ts`
- Test: `tests/config.test.ts`
- Modify: `tests/client.test.ts:9`, `tests/client.test.ts:1399`

**Interfaces:**
- Consumes: nothing.
- Produces: `interface Config { baseUrl: string; apiToken: string; apiKey?: string; isSupport: boolean }` and `loadConfig(): Config`, both exported from `src/config.ts`. Later tasks read `config.isSupport`.

- [ ] **Step 1: Write the failing tests**

In `tests/config.test.ts`, change the `beforeEach` cleanup line `delete process.env.REMNAWAVE_READONLY;` to:

```ts
        delete process.env.REMNAWAVE_IS_SUPPORT;
```

Replace the assertion on line 33 (`expect(config.readonly).toBe(false);`) with:

```ts
        expect(config.isSupport).toBe(true);
```

Replace the whole `loads config with all env vars` test with:

```ts
    it('loads config with all env vars', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        process.env.REMNAWAVE_API_KEY = 'key456';
        process.env.REMNAWAVE_IS_SUPPORT = 'false';
        const config = loadConfig();
        expect(config.baseUrl).toBe('https://panel.example.com');
        expect(config.apiToken).toBe('token123');
        expect(config.apiKey).toBe('key456');
        expect(config.isSupport).toBe(false);
    });
```

Append these three tests inside the same `describe('loadConfig', ...)` block:

```ts
    it('defaults to support mode when REMNAWAVE_IS_SUPPORT is unset', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        expect(loadConfig().isSupport).toBe(true);
    });

    it('leaves support mode only for the exact string "false"', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        process.env.REMNAWAVE_IS_SUPPORT = 'false';
        expect(loadConfig().isSupport).toBe(false);
    });

    it('fails closed on near-miss values', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        for (const value of ['FALSE', 'False', '0', '', 'falce', 'true', 'no']) {
            process.env.REMNAWAVE_IS_SUPPORT = value;
            expect(loadConfig().isSupport, `value: ${JSON.stringify(value)}`).toBe(true);
        }
    });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/config.test.ts`
Expected: FAIL — `config.isSupport` is `undefined`, so the `toBe(true)` assertions fail.

- [ ] **Step 3: Rewrite `src/config.ts`**

Replace the whole file with:

```ts
export interface Config {
    baseUrl: string;
    apiToken: string;
    apiKey?: string;
    isSupport: boolean;
}

export function loadConfig(): Config {
    const baseUrl = (process.env.REMNAWAVE_BASE_URL || '').replace(/\/+$/, '');
    const apiToken = process.env.REMNAWAVE_API_TOKEN || '';
    const apiKey = process.env.REMNAWAVE_API_KEY;
    // This flag guards an access boundary, so it is parsed fail-closed: only
    // the exact string 'false' unlocks full mode. An unset, empty or
    // misspelled value degrades to the restricted support surface.
    const isSupport = process.env.REMNAWAVE_IS_SUPPORT !== 'false';

    return {
        baseUrl,
        apiToken,
        apiKey,
        isSupport,
    };
}

export function isConfigured(config: Config): boolean {
    return !!config.baseUrl && !!config.apiToken;
}
```

- [ ] **Step 4: Update the two client test fixtures**

In `tests/client.test.ts`, both on line 9 and around line 1399, replace `readonly: false,` with:

```ts
            isSupport: false,
```

These fixtures assert raw request URLs and bodies, so they must stay in full mode.

- [ ] **Step 5: Run the full suite and the typechecker**

Run: `npx tsc --noEmit && npx vitest run`
Expected: `tsc` clean. Vitest: `tests/config.test.ts` and `tests/client.test.ts` pass. `tests/readonly.test.ts` still passes — it never touched `Config.readonly`.

- [ ] **Step 6: Commit**

```bash
git add src/config.ts tests/config.test.ts tests/client.test.ts
git commit -m "feat!: replace the readonly config flag with fail-closed isSupport

Support mode is now the default; full access requires the exact string
'false', so a typo or a missing variable degrades to the restricted
surface instead of exposing the whole panel."
```

---

### Task 2: Support profile and registration filter

Adds the allowlist and the `Proxy` that enforces it. Nothing is wired up yet — this task delivers the mechanism and its unit tests.

**Files:**
- Create: `src/support-profile.ts`
- Create: `src/support-filter.ts`
- Test: `tests/support-filter.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `src/support-profile.ts` exports `SUPPORT_TOOLS: ReadonlySet<string>`, `SUPPORT_RESOURCES: ReadonlySet<string>`, `SUPPORT_PROMPTS: ReadonlySet<string>`, `REDACTED_FIELDS: readonly string[]`.
  - `src/support-filter.ts` exports `restrictToSupport(server: McpServer): McpServer`.
  - Task 3 calls `restrictToSupport`; Task 4 imports `REDACTED_FIELDS`.

- [ ] **Step 1: Write the failing test**

Create `tests/support-filter.test.ts`:

```ts
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

    it('forwards non-gated members without breaking private field access', () => {
        const gated = restrictToSupport(makeServer());

        // isConnected() reads McpServer internals. If the proxy forwarded
        // property reads with itself as the receiver, this would throw.
        expect(() => gated.isConnected()).not.toThrow();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/support-filter.test.ts`
Expected: FAIL — `Cannot find module '../src/support-filter.js'`.

- [ ] **Step 3: Create `src/support-profile.ts`**

```ts
/**
 * The complete support-mode surface.
 *
 * Support mode is a blast-radius boundary for the support bot: everything it
 * may reach is listed here and nowhere else, so the whole boundary can be read
 * in one file. Adding a name here widens what an LLM can do on a user's
 * account — treat edits as security changes.
 */

/** Tools a support bot may call. The only mutation is removing HWID devices. */
export const SUPPORT_TOOLS: ReadonlySet<string> = new Set([
    'users_resolve',
    'users_get',
    'users_get_by_username',
    'users_get_by_short_uuid',
    'users_accessible_nodes',
    'subscriptions_get_by_user_id',
    'subscriptions_get_by_username',
    'subscriptions_get_by_short_uuid',
    'subscription_info',
    'bandwidth_user_usage',
    'hwid_devices_list',
    'hwid_device_delete',
    'hwid_devices_delete_all',
]);

/** Resources are a second data channel, gated by the same mechanism. */
export const SUPPORT_RESOURCES: ReadonlySet<string> = new Set(['user-details']);

export const SUPPORT_PROMPTS: ReadonlySet<string> = new Set(['user_audit']);

/**
 * Working VPN credentials. Stripped from every panel response in support mode,
 * so an ordinary user lookup cannot place them in the LLM context.
 * `subscriptionUrl` is deliberately absent: the bot hands out that link.
 */
export const REDACTED_FIELDS: readonly string[] = [
    'trojanPassword',
    'ssPassword',
    'vlessUuid',
];
```

- [ ] **Step 4: Create `src/support-filter.ts`**

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    SUPPORT_PROMPTS,
    SUPPORT_RESOURCES,
    SUPPORT_TOOLS,
} from './support-profile.js';

/**
 * McpServer exposes both the short registration methods and the newer
 * `register*` aliases. Both are gated: intercepting only one set would leave a
 * hole the moment anyone reaches for the other.
 */
const GATED_METHODS: Record<string, ReadonlySet<string>> = {
    tool: SUPPORT_TOOLS,
    registerTool: SUPPORT_TOOLS,
    resource: SUPPORT_RESOURCES,
    registerResource: SUPPORT_RESOURCES,
    prompt: SUPPORT_PROMPTS,
    registerPrompt: SUPPORT_PROMPTS,
};

/**
 * Wraps a server so that registrations outside the support profile are dropped.
 * Registration modules see an ordinary McpServer and stay unaware of modes.
 *
 * Skipped registrations return `undefined`, so callers must not use the return
 * value of a registration call.
 */
export function restrictToSupport(server: McpServer): McpServer {
    return new Proxy(server, {
        get(target, prop) {
            // Read with `target` as the receiver. McpServer is a class using
            // private fields, and forwarding the proxy as the receiver makes
            // those reads throw.
            const value = Reflect.get(target, prop, target);
            if (typeof value !== 'function') {
                return value;
            }

            const allowed = typeof prop === 'string' ? GATED_METHODS[prop] : undefined;
            if (!allowed) {
                return value.bind(target);
            }

            return (name: string, ...rest: unknown[]) =>
                allowed.has(name) ? value.apply(target, [name, ...rest]) : undefined;
        },
    });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsc --noEmit && npx vitest run tests/support-filter.test.ts`
Expected: `tsc` clean, 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/support-profile.ts src/support-filter.ts tests/support-filter.test.ts
git commit -m "feat: add the support profile and its registration filter

Gates both the short registration methods and the register* aliases, so
neither spelling can bypass the allowlist."
```

---

### Task 3: Wire the filter in and drop `readonly` from the modules

Makes the flag actually switch modes, and removes the now-dead per-module `readonly` branch.

**Files:**
- Modify: `src/server.ts`
- Modify: `src/tools/index.ts`
- Modify (drop the `readonly` parameter and its `if (readonly) return;` line): `src/tools/api-tokens.ts`, `connections.ts`, `external-squads.ts`, `hosts.ts`, `hwid.ts`, `inbounds.ts`, `infra-billing.ts`, `metadata.ts`, `node-integrations.ts`, `node-plugins.ts`, `nodes.ts`, `settings.ts`, `snippets.ts`, `squads.ts`, `subscription-page-configs.ts`, `users.ts`
- Delete: `tests/readonly.test.ts`
- Create: `tests/support.test.ts`

**Interfaces:**
- Consumes: `restrictToSupport` from Task 2; `SUPPORT_TOOLS`, `SUPPORT_RESOURCES`, `SUPPORT_PROMPTS` from Task 2; `Config.isSupport` from Task 1.
- Produces: `registerAllTools(server: McpServer, client: RemnawaveClient): void` — two parameters, no `readonly`. Every `register*Tools` function drops to `(server: McpServer, client: RemnawaveClient)`.

`src/tools/system.ts`, `subscriptions.ts`, `keygen.ts` and `bandwidth.ts` never took `readonly` and need no signature change.

- [ ] **Step 1: Write the failing test**

Delete `tests/readonly.test.ts` and create `tests/support.test.ts`:

```ts
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
        const mutating = tools.filter((name) => name.startsWith('hwid_device'));

        expect(mutating.sort()).toEqual(['hwid_device_delete', 'hwid_devices_delete_all']);
        expect(tools).not.toContain('users_update');
        expect(tools).not.toContain('users_extend_expiration');
        expect(tools).not.toContain('users_delete');
        expect(tools).not.toContain('keygen_get');
        expect(tools).not.toContain('users_list');
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

        expect(tools).toHaveLength(178);
        expect(resources).toHaveLength(4);
        expect(prompts).toHaveLength(5);
        expect(new Set(tools).size).toBe(178);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/support.test.ts`
Expected: FAIL — `registerAllTools` still requires a third argument, and in full mode the modules still cut writes when it is `undefined`.

- [ ] **Step 3: Drop the `readonly` parameter from the 16 modules**

In each of `src/tools/api-tokens.ts`, `connections.ts`, `external-squads.ts`, `hosts.ts`, `infra-billing.ts`, `metadata.ts`, `node-integrations.ts`, `node-plugins.ts`, `nodes.ts`, `settings.ts`, `snippets.ts`, `subscription-page-configs.ts`, `users.ts`: change the single-line signature from

```ts
export function registerXTools(server: McpServer, client: RemnawaveClient, readonly: boolean) {
```

to

```ts
export function registerXTools(server: McpServer, client: RemnawaveClient) {
```

and delete the `if (readonly) return;` line together with the blank line that follows it.

`src/tools/hwid.ts`, `inbounds.ts` and `squads.ts` use a multi-line signature — delete the `    readonly: boolean,` line from each, then delete their `if (readonly) return;` line as well.

Verify none remain:

```bash
grep -rn "readonly" src/tools/ | grep -v "readonly string\[\]"
```

Expected: no output.

- [ ] **Step 4: Update `src/tools/index.ts`**

Replace the body of `registerAllTools` with:

```ts
export function registerAllTools(server: McpServer, client: RemnawaveClient) {
    registerUserTools(server, client);
    registerNodeTools(server, client);
    registerHostTools(server, client);
    registerSystemTools(server, client);
    registerSubscriptionTools(server, client);
    registerInboundTools(server, client);
    registerSquadTools(server, client);
    registerHwidTools(server, client);
    registerApiTokenTools(server, client);
    registerKeygenTools(server, client);
    registerInfraBillingTools(server, client);
    registerSnippetTools(server, client);
    registerExternalSquadTools(server, client);
    registerSettingsTools(server, client);
    registerSubPageConfigTools(server, client);
    registerNodePluginTools(server, client);
    registerConnectionTools(server, client);
    registerBandwidthTools(server, client);
    registerNodeIntegrationTools(server, client);
    registerMetadataTools(server, client);
}
```

- [ ] **Step 5: Wire the filter into `src/server.ts`**

Replace the whole file with:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RemnawaveClient } from './client/index.js';
import { Config } from './config.js';
import { registerAllTools } from './tools/index.js';
import { registerAllResources } from './resources/index.js';
import { registerAllPrompts } from './prompts/index.js';
import { restrictToSupport } from './support-filter.js';

export function createServer(config: Config): McpServer {
    const server = new McpServer({
        name: 'remnawave-mcp',
        version: '3.0.0',
    });

    const client = new RemnawaveClient(config);
    // Registration goes through the gate; the caller still connects the real
    // server instance.
    const target = config.isSupport ? restrictToSupport(server) : server;

    registerAllTools(target, client);
    registerAllResources(target, client);
    registerAllPrompts(target);

    return server;
}
```

- [ ] **Step 6: Run the full suite and the typechecker**

Run: `npx tsc --noEmit && npx vitest run`
Expected: `tsc` clean; all suites pass, including the four new `support mode` tests.

If `full mode filters nothing` reports a count other than 178/4/5, do **not** edit the expected numbers — a mismatch means a registration was lost while stripping parameters. Find the module that stopped registering and fix it.

- [ ] **Step 7: Commit**

```bash
git add src/server.ts src/tools tests/support.test.ts
git rm tests/readonly.test.ts
git commit -m "feat!: switch registration on isSupport instead of readonly

One proxy in createServer gates tools, resources and prompts, so the 20
registration modules no longer carry a mode parameter."
```

---

### Task 4: Strip credentials from responses in support mode

Without this, an ordinary `users_get` still returns working VLESS/Trojan/SS credentials, and the tool allowlist means little.

**Files:**
- Modify: `src/client/index.ts`
- Test: `tests/client.test.ts`

**Interfaces:**
- Consumes: `REDACTED_FIELDS` from Task 2; `Config.isSupport` from Task 1.
- Produces: no new exports. `RemnawaveClient.request()` returns redacted data when the client was constructed with `isSupport: true`.

- [ ] **Step 1: Write the failing test**

Append to `tests/client.test.ts`, inside the top-level `describe('RemnawaveClient', ...)` block:

```ts
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
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/client.test.ts -t "support-mode redaction"`
Expected: FAIL — `trojanPassword` is still `'trojan-secret'` in support mode.

- [ ] **Step 3: Add redaction to the client**

In `src/client/index.ts`, add the profile import next to the existing `Config` import:

```ts
import { Config, isConfigured } from '../config.js';
import { REDACTED_FIELDS } from '../support-profile.js';
```

Add this module-level helper directly above `export class RemnawaveClient`:

```ts
/**
 * Deletes credential fields in place, everywhere they appear. The value comes
 * straight from `res.json()` on every call, so nothing else holds a reference
 * to it and mutating is safe.
 */
function stripCredentials(value: unknown): void {
    if (Array.isArray(value)) {
        for (const item of value) {
            stripCredentials(item);
        }
        return;
    }
    if (value === null || typeof value !== 'object') {
        return;
    }
    const record = value as Record<string, unknown>;
    for (const field of REDACTED_FIELDS) {
        delete record[field];
    }
    for (const nested of Object.values(record)) {
        stripCredentials(nested);
    }
}
```

Add the field to the class, next to the existing private fields:

```ts
    private isSupport: boolean;
```

Assign it in the constructor, after `this.configured = isConfigured(config);`:

```ts
        this.isSupport = config.isSupport;
```

Finally, replace the last line of `request()`:

```ts
        return res.json() as Promise<T>;
```

with:

```ts
        const data = (await res.json()) as T;
        if (this.isSupport) {
            stripCredentials(data);
        }
        return data;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsc --noEmit && npx vitest run`
Expected: `tsc` clean; the three redaction tests pass and every pre-existing client test still passes — those fixtures use `isSupport: false`.

- [ ] **Step 5: Commit**

```bash
git add src/client/index.ts tests/client.test.ts
git commit -m "feat: strip VPN credentials from responses in support mode

Redaction sits in the client rather than in toolResult so that the MCP
resource channel, which reads the client directly, is covered too."
```

---

### Task 5: Documentation and the 3.0.0 release bump

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `docker-compose.yml`
- Modify: `docs/remnawave-3-x-migration.md`

**Interfaces:**
- Consumes: the behaviour delivered by Tasks 1–4.
- Produces: no code.

- [ ] **Step 1: Bump the version**

In `package.json`, change `"version": "2.0.0"` to:

```json
  "version": "3.0.0",
```

- [ ] **Step 2: Rewrite `.env.example`**

Replace the readonly comment block at the end with:

```
# Mode. Support mode is the DEFAULT: 13 tools, one mutating operation
# (removing HWID devices), VPN credentials stripped from responses.
# Set to exactly "false" for unrestricted full access — any other value,
# including a typo or an empty string, keeps support mode.
# REMNAWAVE_IS_SUPPORT=false
```

- [ ] **Step 3: Update `docker-compose.yml`**

Replace the `REMNAWAVE_READONLY` environment line with:

```yaml
      - REMNAWAVE_IS_SUPPORT=${REMNAWAVE_IS_SUPPORT:-true}
```

- [ ] **Step 4: Update the English half of `README.md`**

Change line 13 to:

```markdown
**Version:** 3.0.0 | **Remnawave panel:** 3.3.x (API contract 3.4.x)
```

Change the readonly feature bullet (line 20) to:

```markdown
- **Support mode (default)** — restrict to 13 user-facing tools with credentials stripped, for support bots
```

In the configuration table, replace the `REMNAWAVE_READONLY` row with:

```markdown
| `REMNAWAVE_IS_SUPPORT` | No | Support mode, **on by default**. Set to exactly `false` for full access |
```

Replace the whole `### Readonly Mode` section — heading, prose and the category table — with:

```markdown
### Support Mode

The server runs in one of two modes.

**Support mode is the default.** It exposes 13 user-facing tools, 1 resource and
1 prompt, and strips `trojanPassword`, `ssPassword` and `vlessUuid` from every
panel response. The only mutating operation is removing HWID devices, which is
safe: a device re-registers on the next connect. Intended for support bots that
act on behalf of an end user.

**Full mode** has no restrictions: all 178 tools, 4 resources, 5 prompts, and
untouched responses. Enable it with `REMNAWAVE_IS_SUPPORT=false`.

The flag is parsed fail-closed — only the exact string `false` unlocks full
mode, so an unset, empty or misspelled value keeps the restricted surface.

Tools available in support mode:

| Category | Tools |
|----------|-------|
| User lookup (4) | `users_resolve`, `users_get`, `users_get_by_username`, `users_get_by_short_uuid` |
| Subscription (4) | `subscriptions_get_by_user_id`, `subscriptions_get_by_username`, `subscriptions_get_by_short_uuid`, `subscription_info` |
| Access and usage (2) | `users_accessible_nodes`, `bandwidth_user_usage` |
| Devices (3) | `hwid_devices_list`, `hwid_device_delete`, `hwid_devices_delete_all` |

Resource: `remnawave://users/{userId}`. Prompt: `user_audit`.

> The allowlist reduces blast radius; it is not a security boundary, since the
> process still holds a panel token that can do anything. For a real boundary,
> issue the bot a scoped API token — Remnawave 3.x accepts `scopes` on
> `POST /api/tokens` and lists the catalogue at `GET /api/tokens/scopes`.
```

In both Claude Desktop / Cursor JSON examples, replace `"REMNAWAVE_READONLY": "false"` with:

```json
        "REMNAWAVE_IS_SUPPORT": "false"
```

- [ ] **Step 5: Update the Russian half of `README.md`**

Change the version line to:

```markdown
**Версия:** 3.0.0 | **Панель Remnawave:** 3.3.x (контракт API 3.4.x)
```

Change the readonly feature bullet to:

```markdown
- **Режим support (по умолчанию)** — 13 пользовательских инструментов с вырезанными кредами, для саппорт-ботов
```

Replace the `REMNAWAVE_READONLY` row in the configuration table with:

```markdown
| `REMNAWAVE_IS_SUPPORT` | Нет | Режим support, **включён по умолчанию**. Ровно `false` — полный доступ |
```

Replace the whole `### Режим Readonly` section with:

```markdown
### Режим Support

Сервер работает в одном из двух режимов.

**Support — режим по умолчанию.** Открыто 13 пользовательских инструментов,
1 ресурс и 1 промпт, а из каждого ответа панели вырезаются `trojanPassword`,
`ssPassword` и `vlessUuid`. Единственная операция записи — удаление
HWID-устройств; она безопасна, устройство снова появится при следующем
подключении. Режим рассчитан на саппорт-ботов, действующих от имени
пользователя.

**Full — без ограничений:** все 178 инструментов, 4 ресурса, 5 промптов,
ответы не трогаются. Включается через `REMNAWAVE_IS_SUPPORT=false`.

Флаг разбирается fail-closed: полный режим включает только точная строка
`false`, а пустое, отсутствующее или написанное с опечаткой значение оставляет
урезанную поверхность.

Инструменты в режиме support:

| Категория | Инструменты |
|-----------|-------------|
| Поиск пользователя (4) | `users_resolve`, `users_get`, `users_get_by_username`, `users_get_by_short_uuid` |
| Подписка (4) | `subscriptions_get_by_user_id`, `subscriptions_get_by_username`, `subscriptions_get_by_short_uuid`, `subscription_info` |
| Доступ и расход (2) | `users_accessible_nodes`, `bandwidth_user_usage` |
| Устройства (3) | `hwid_devices_list`, `hwid_device_delete`, `hwid_devices_delete_all` |

Ресурс: `remnawave://users/{userId}`. Промпт: `user_audit`.

> Allowlist уменьшает радиус поражения, но не является границей безопасности:
> процесс всё ещё держит токен панели, которым можно всё. Настоящая граница —
> скоупнутый API-токен: Remnawave 3.x принимает `scopes` в `POST /api/tokens`
> и отдаёт каталог в `GET /api/tokens/scopes`.
```

In both JSON examples in the Russian half, replace `"REMNAWAVE_READONLY": "false"` with:

```json
        "REMNAWAVE_IS_SUPPORT": "false"
```

- [ ] **Step 6: Retitle the migration doc**

In `docs/remnawave-3-x-migration.md`, change the heading and version line to:

```markdown
# Remnawave 2.8.x → 3.3.0 Migration (MCP 3.0.0)
```

```markdown
**MCP version:** 1.3.1 → 3.0.0
```

- [ ] **Step 7: Verify no stale references remain**

Run:

```bash
grep -rn "REMNAWAVE_READONLY\|readonly mode\|Readonly Mode\|Режим Readonly" README.md .env.example docker-compose.yml docs/ src/ tests/
```

Expected: no output.

Then run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: clean typecheck, all tests pass, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add package.json README.md .env.example docker-compose.yml docs/remnawave-3-x-migration.md
git commit -m "docs: document support mode, release 3.0.0

Support mode is the default, so an existing admin deployment must add
REMNAWAVE_IS_SUPPORT=false when upgrading."
```

---

## Post-implementation check

Confirm the mode switch end-to-end against the built artifact:

```bash
REMNAWAVE_BASE_URL=https://x.example REMNAWAVE_API_TOKEN=t node -e '
const { spawn } = require("node:child_process");
for (const v of [undefined, "false"]) {
  const env = { ...process.env };
  if (v === undefined) delete env.REMNAWAVE_IS_SUPPORT; else env.REMNAWAVE_IS_SUPPORT = v;
  const p = spawn("node", ["dist/index.js"], { env, stdio: ["pipe", "pipe", "inherit"] });
  let buf = "";
  p.stdout.on("data", d => { buf += d; for (const l of buf.split("\n")) { if (!l.trim()) continue;
    try { const m = JSON.parse(l); if (m.id === 2) { console.log("IS_SUPPORT=" + v, "tools:", m.result.tools.length); p.kill(); } } catch {} } });
  p.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "x", version: "1" } } }) + "\n");
  setTimeout(() => { p.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
    p.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) + "\n"); }, 400);
}'
```

Expected output (order may vary):

```
IS_SUPPORT=undefined tools: 13
IS_SUPPORT=false tools: 178
```
