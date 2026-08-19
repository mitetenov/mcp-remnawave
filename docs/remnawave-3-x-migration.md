# Remnawave 2.8.x → 3.3.0 Migration (MCP 2.0.0)

**Researched:** 2026-08-20
**MCP version:** 1.3.1 → 2.0.0
**Contract:** `@remnawave/backend-contract@^2.8.28` → `^3.4.2`
**Target panel:** Remnawave 3.3.0 (released 2026-08-18)

> Version mapping caveat: since 3.0.0 the contract version no longer tracks the panel version.
> Panel **3.3.0** ships contract **3.4.2** (see `libs/contract/package.json` at tag `3.3.0` in
> `remnawave/backend`). Pin the contract by what the panel actually bundles, not by matching numbers.

---

## 1. The headline change: users have no UUID

`UsersSchema` dropped the `uuid` field. A user is identified by its numeric `id`.
Everything keyed on a user changed accordingly:

| Old | New |
|---|---|
| `GET /api/users/{uuid}` | `GET /api/users/{userId}` |
| `POST /api/users/{uuid}/actions/*` | `POST /api/users/{userId}/actions/*` |
| `GET /api/metadata/user/{uuid}` | `GET /api/metadata/user/{userId}` |
| `GET /api/hwid/devices/{userUuid}` | `GET /api/hwid/devices/{userId}` |
| `GET /api/bandwidth-stats/users/{uuid}` | `GET /api/bandwidth-stats/users/{userId}` |
| `GET /api/subscriptions/by-uuid/{uuid}` | `GET /api/subscriptions/by-id/{userId}` |
| `GET /api/subscriptions/connection-keys/{uuid}` | `GET /api/subscriptions/connection-keys/{userId}` |
| bulk bodies `{ uuids: string[] }` | `{ userIds: number[] }` |
| `POST /api/users` accepted a custom `uuid` | removed (`shortUuid` still accepted) |
| `PATCH /api/users` keyed on `uuid` \| `username` | keyed on `id` \| `username` |
| `POST /api/users/resolve` accepted `uuid` | `id` \| `shortUuid` \| `username` only |

## 2. Removed endpoints

- `GET /api/users/by-email/{email}`
- `GET /api/users/by-id/{id}` (folded into `GET /api/users/{userId}`)
- `GET /api/users/by-tag/{tag}`
- `GET /api/users/by-telegram-id/{id}`
- `GET /api/users/by-subscription-uuid/{uuid}`
- `POST /api/system/tools/happ/encrypt`
- `GET /api/bandwidth-stats/**/legacy`

Only `by-username` and `by-short-uuid` survive, plus `POST /api/users/resolve`.

## 3. `ip-control` → `connections`

The whole controller was replaced:

| Old | New |
|---|---|
| `POST /api/ip-control/fetch-ips/{uuid}` | `POST /api/connections/by-user/{userId}` |
| `GET /api/ip-control/fetch-ips/result/{jobId}` | `GET /api/connections/by-user/{jobId}` |
| `POST /api/ip-control/fetch-users-ips/{nodeUuid}` | `POST /api/connections/by-node/{nodeUuid}` |
| `GET /api/ip-control/fetch-users-ips/result/{jobId}` | `GET /api/connections/by-node/{jobId}` |
| `POST /api/ip-control/drop-connections` | `POST /api/connections/drop` |

`dropBy` also changed: the `userUuids` variant became `userIds: number[]`.

## 4. Contract API renames (compile-time)

- `Command.RequestSchema` → `Command.RequestBodySchema`; type `Command.Request` → `Command.RequestBody`
- Many commands no longer export a `Response` type. The MCP client dropped its `Command.Response`
  generics as a result — results are serialised straight to JSON, so nothing downstream depended on them.
- Namespace renames used by this repo: `ReorderNodeCommand` → `ReorderNodesCommand`,
  `Create/Update/Delete/Clone/ReorderSubscriptionPageConfig*` → `*SubpageConfig*`,
  `CreateInfraBillingHistoryRecordCommand` → `CreateInfraBillingRecordCommand`,
  `Delete*ByUuidCommand` → `Delete*Command`, `UpdateSnippetsCommand` → `UpdateSnippetCommand`.
- `REST_API.REMNAAWAVE_SETTINGS` kept its historical typo; only the internal `CONTROLLERS` key was fixed.
- The contract now targets zod v4 natively (this repo was already on zod 4).

## 5. Semantics fixed while migrating

`POST /api/internal-squads/{uuid}/bulk-actions/add-users` adds **all** panel users — it never took a
body. The pre-3.x MCP sent `{ userUuids }` to it, which the panel ignored, so "add these users"
silently added everyone. 3.x adds proper `add-many-users` / `remove-many-users` endpoints taking
`{ userIds: number[] }`, and the tools now map to them:

- `squads_add_users` / `squads_remove_users` → specific users by ID
- `squads_add_all_users` / `squads_remove_all_users` → the old all-users behaviour, named honestly
- external squads only have the all-users variants → `external_squads_add_all_users` / `..._remove_all_users`

`remove-users` and `remove-many-users` are `DELETE`, not `POST`; the client sends a DELETE with a body.

## 6. New endpoints exposed as tools

| Area | Tools |
|---|---|
| Users | `users_extend_expiration`, `users_accessible_nodes` |
| Internal squads | `squads_add_users`, `squads_remove_users` (by ID) |
| System | `system_stats_digest`, `system_http_stats`, `system_configuration` |
| API tokens | `api_tokens_ott` |
| Snippets | `snippets_sync` |
| Node plugins | `node_plugins_sync`, `node_plugins_shared_lists_*` (5) |
| Node integrations | `node_integrations_*` (5) |
| Connections | `connections_geocheck_by_node`, `connections_geocheck_by_node_result` |
| Bandwidth stats | `bandwidth_nodes_list`, `bandwidth_nodes_realtime`, `bandwidth_user_usage`, `bandwidth_nodes_usage`, `bandwidth_squad_usage`, `bandwidth_squad_user_usage` |

Tool count: **153 → 178** (readonly **69 → 81**).

## 7. Not migrated

- `GET /api/users/stream` (Redis-Streams style export) — a streaming endpoint does not fit the
  request/response shape of an MCP tool.
- `GET /api/tokens/scopes` is still unexposed, as before.
