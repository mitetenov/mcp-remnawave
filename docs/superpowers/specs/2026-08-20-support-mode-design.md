# Support mode: replacing `readonly` with `isSupport`

**Date:** 2026-08-20
**Status:** approved, ready for implementation planning
**Applies to:** mcp-remnawave 2.0.0 (branch `feat/remnawave-3x`)

## Problem

This MCP server backs a support bot. The bot talks to end users, and the only
mutation it should be able to perform on their behalf is removing HWID devices
from a subscription — a safe operation, since a device re-registers on the next
connect.

The existing `REMNAWAVE_READONLY` flag cannot express that. It is a boolean
applied per module as `if (readonly) return;`, so it offers exactly two settings:

| `REMNAWAVE_READONLY` | Tools | HWID delete | `users_delete`, `nodes_restart_all`, `users_bulk_all_update` |
|---|---|---|---|
| `true` | 81 | no | no |
| `false` | 178 | yes | yes |

To grant one safe write, the deployment must grant every destructive one.

Readonly is also not a data boundary. Among its 81 tools: `keygen_get` returns
the node `SECRET_KEY`; `users_list` returns `trojanPassword`, `ssPassword` and
`vlessUuid` for every user on the page; `settings_get` and `system_configuration`
return panel internals. All are `kind: 'read'`, so readonly admits them.

## Solution

Replace the `readonly` boolean with `isSupport`, switching between two modes:

- **full** (`isSupport: false`, the default) — no restrictions, all 178 tools,
  4 resources, 5 prompts, responses untouched.
- **support** (`isSupport: true`) — a fixed allowlist of 13 tools, 1 resource,
  1 prompt, with VPN credentials stripped from every response.

## The support surface

### Tools (13)

| Tool | Why |
|---|---|
| `users_resolve` | lookup by id, shortUuid or username |
| `users_get` | user card by numeric id |
| `users_get_by_username` | user card by username |
| `users_get_by_short_uuid` | user card by short uuid |
| `users_accessible_nodes` | which servers this user may connect to |
| `subscriptions_get_by_user_id` | subscription state by id |
| `subscriptions_get_by_username` | subscription state by username |
| `subscriptions_get_by_short_uuid` | subscription state by short uuid |
| `subscription_info` | public subscription info by short uuid |
| `bandwidth_user_usage` | this user's traffic consumption |
| `hwid_devices_list` | this user's devices |
| `hwid_device_delete` | **write** — remove one device |
| `hwid_devices_delete_all` | **write** — remove all devices |

### Resources (1)

Only `user-details` (`remnawave://users/{userId}`).

Dropped: `panel-stats`, `panel-nodes`, `panel-health` — system telemetry.
Resources are a second data channel that bypasses the tool list, so they are
gated by the same mechanism.

### Prompts (1)

Only `user_audit`, which drives `users_get`, `subscriptions_get_by_user_id` and
`hwid_devices_list` — all in the profile.

Dropped: `create_user_wizard`, `node_diagnostics`, `traffic_report`,
`bulk_user_cleanup` — administrator workflows.

### Response redaction

In support mode the client removes `trojanPassword`, `ssPassword` and
`vlessUuid` from every response, recursively, wherever they appear.
`subscriptionUrl` is kept — the bot hands the user their subscription link.

This is required for the tool allowlist to mean anything: `users_get` returns a
user object carrying those three credential fields, so gating tools alone would
still place working VLESS/Trojan/SS credentials in the LLM context on an
ordinary lookup.

### Classification decisions worth recording

Resolved with the product owner:

- **Raw configs and connection keys** (`subscriptions_get_raw_by_short_uuid`,
  `subscriptions_get_connection_keys`) — full only. The bot gives out the
  subscription URL; the user pastes it into their client themselves.
- **`users_revoke_subscription`** — full only. It leaves paid terms untouched
  but cuts off every device until reconfiguration, so an erroneous LLM call
  leaves a paying customer without service.
- **`connections_by_user` / `_result` / `connections_drop`** — full only.

Decided from the stated rules ("no system data, no editing paid features"):

- Everything under nodes, hosts, config profiles, snippets, node plugins, node
  integrations, infra billing, settings, subscription page configs, API tokens,
  keygen, metadata, internal and external squads, and all of `system_*`.
- Every write that touches paid terms: `users_update`, `users_extend_expiration`,
  `users_reset_traffic`, `users_enable`, `users_disable`, `users_create`,
  `users_delete`, and all bulk operations.
- `users_list` and `subscriptions_list` — paginated dumps of other users' data;
  lookup goes through `users_resolve`.
- `hwid_devices_list_all`, `hwid_top_users`, `hwid_stats` — other users' data.
- `users_tags_list`, `metadata_user_get` — administrative annotation of unknown
  content.
- `hwid_device_create` — unnecessary; a device reappears on the next connect.

## Architecture

### Single interception point

`createServer` wraps the `McpServer` once, before any registration:

```ts
const target = config.isSupport ? restrictToSupport(server) : server;
registerAllTools(target, client);
registerAllResources(target, client);
registerAllPrompts(target);
```

Tool, resource and prompt modules stay unaware of modes. The `readonly`
parameter is removed from every register function; they always register
everything and the wrapper decides what survives.

### `src/support-profile.ts` (new)

The entire boundary in one auditable file:

```ts
export const SUPPORT_TOOLS: ReadonlySet<string>;      // the 13 names
export const SUPPORT_RESOURCES: ReadonlySet<string>;  // 'user-details'
export const SUPPORT_PROMPTS: ReadonlySet<string>;    // 'user_audit'
export const REDACTED_FIELDS: readonly string[];      // the 3 credential fields
```

### `restrictToSupport`

A `Proxy` intercepting registration methods; a call whose first argument is not
in the matching set is dropped and returns `undefined`.

Three implementation constraints:

1. **Gate all six method names.** `McpServer` exposes both the short forms this
   repo uses (`tool`, `resource`, `prompt`) and the newer aliases
   (`registerTool`, `registerResource`, `registerPrompt`). Intercepting only the
   short forms leaves a hole the moment anyone reaches for an alias, so the
   proxy gates `tool` and `registerTool` against `SUPPORT_TOOLS`, `resource` and
   `registerResource` against `SUPPORT_RESOURCES`, `prompt` and `registerPrompt`
   against `SUPPORT_PROMPTS`.
2. `McpServer` is a class instance using private fields. Forwarding property
   reads with the proxy as receiver breaks them, so the handler must read with
   `Reflect.get(target, prop, target)` and bind returned functions to `target`.
3. Register functions must not use the return value of a registration call.
   They currently do not; this becomes a rule.

### Redaction in the client, not in `toolResult`

`RemnawaveClient.request()` is the single point every panel response passes
through, including responses that resources read directly from the client.
Redaction applied in `toolResult` would leave the resource channel exposed.

The client already receives `Config`, so it stores `isSupport` and applies a
recursive key-strip before returning, in support mode only. The value being
stripped is freshly parsed from `res.json()` on every call, so stripping in
place is safe — nothing else holds a reference to it.

### Configuration

`Config.readonly: boolean` becomes `Config.isSupport: boolean`, read from
`REMNAWAVE_IS_SUPPORT === 'true'`. `REMNAWAVE_READONLY` is removed outright:
2.0.0 is unreleased on this branch, so there is nothing to keep compatible.

The default stays `false` (full mode), matching the old default. A deployment
that wants support mode must set the flag explicitly, and the README says so.

## Scope of change

| File | Change |
|---|---|
| `src/config.ts` | `readonly` → `isSupport`, new env var |
| `src/support-profile.ts` | new — allowlists and redacted field names |
| `src/support-filter.ts` | new — `restrictToSupport` |
| `src/server.ts` | wrap the server when `isSupport` |
| `src/client/index.ts` | store `isSupport`, redact in `request()` |
| `src/tools/index.ts` | drop `readonly` from `registerAllTools` |
| 16 tool modules | drop the `readonly` parameter and its early return |
| `tests/readonly.test.ts` | replaced by `tests/support.test.ts` |
| `README.md` | rewrite the mode section, both languages |
| `.env.example`, `docker-compose.yml` | new variable |

The four modules that never took `readonly` — `system.ts`, `subscriptions.ts`,
`keygen.ts`, `bandwidth.ts` — need no signature change.

## Testing

- Support mode registers **exactly** the 13 names — compared as sets, not counts,
  so an accidental addition fails.
- Every name in `SUPPORT_TOOLS` exists in the full tool set. Guards against a
  rename silently dropping a tool out of the profile.
- Support mode registers exactly 1 resource and 1 prompt.
- Full mode filters nothing: 178 tools, 4 resources, 5 prompts.
- A registration made through an alias (`registerTool`) is gated in support mode
  just like the short form.
- The client strips the three credential fields in support mode, including from
  nested objects and arrays, and keeps `subscriptionUrl`.
- The client redacts nothing in full mode.

## Out of scope

Recorded so it is not forgotten, but not part of this change:

The MCP-side allowlist is ergonomics and blast-radius reduction, not a security
boundary — the process still holds a panel token that can do anything. The real
boundary is a scoped API token: Remnawave 3.x accepts `scopes` on
`POST /api/tokens` and publishes the catalogue at `GET /api/tokens/scopes`.
Issuing the bot a token limited to the endpoints behind these 13 tools makes the
destructive operations impossible regardless of what the MCP exposes.

Also out of scope: HTTP transport authentication, per-session transports, and
client timeouts — tracked separately.
