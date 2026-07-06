# Remnawave 2.8.0 → 2.9.x Changes Affecting MCP

**Researched:** 2026-07-06  
**Current MCP Version:** 1.2.2  
**Current Contract:** `@remnawave/backend-contract@^2.8.28`  
**Previously Documented API:** 2.7.4 (outdated — see below)  
**Latest backend-contract on npm:** 2.9.13  
**Latest Remnawave Panel:** 2.9.0

> Overall finding: the MCP uses `@remnawave/backend-contract@^2.8.28`, which maps to **Remnawave 2.8.x** API.  
> The contract already covers 2.8.0 changes. However, **Remnawave 2.9.0 introduced several breaking changes** that the current contract version does not account for. Users on 2.9.0 will experience failures.

---

## 1. Overview of version mapping

| Remnawave Panel | backend-contract | Status for MCP |
|---|---|---|
| 2.7.x | < 2.8.0 | Originally documented API — old 2.7.4 |
| **2.8.0** → 2.8.x | **2.8.0 → 2.8.35** | **MCP uses 2.8.28 — partially compatible** |
| **2.9.0** | **2.9.0+** | **BREAKING — contract must be updated** |

The MCP README says "Remnawave API: 2.7.4" — this is stale and should say "Remnawave API: 2.8.x".

---

## 2. Changes in Remnawave 2.8.0 (covered by current contract ^2.8.28)

The `@remnawave/backend-contract@^2.8.28` already includes these 2.8.0 changes via its `REST_API` route map and TypeScript types. **No changes needed for 2.8.0 compatibility.**

### Hosts
- `tag` (string) replaced with `tags` (string array, max 10)
- `allowInsecure` removed, replaced with `pinnedPeerCertSha256` + `verifyPeerCertByName`
- New field: `mihomoIpVersion` (dual/ipv4/ipv6/ipv4-prefer/ipv6-prefer)
- ALPN now supports h2, h3, h3,h2, h3,h2,http/1.1
- `fingerprint` enum values removed — now a free string
- `host`, `path`, `sni` are now nullable
- `isDisabled` and `excludeFromSubscriptionTypes` always returned (required)
- Bulk endpoints `POST /api/hosts/bulk/set-inbound` and `POST /api/hosts/bulk/set-port` removed — replaced by `PATCH /api/hosts/bulk/update`
- New `mihomoX25519` field

### Nodes
- Added `nodeConsumptionMultiplier`, `note` (255 chars), `proxyUrl` (SOCKS5 proxy)
- Restart endpoints (`POST /api/nodes/{uuid}/actions/restart`, `POST /api/nodes/actions/restart-all`) now require `forceRestart: boolean` in request body

### Users
- `trafficLimitBytes` type changed from `integer` to `number`
- HWID: `userUuid` → `userId` (BigInt), added `requestIp` (nullable)
- Subscription (raw): `isHwidLimited` (boolean) → `hwidCheckup` (object/nullable)
- Response rules: new `encryption` and `disableHwidCheck` fields

### System
- `POST /api/system/tools/happ/encrypt` removed
- New endpoint: `POST /api/bandwidth-stats/nodes/users` (per-user bandwidth by multiple nodes)

---

## 3. Breaking changes in Remnawave 2.9.0 (NOT covered by current contract)

These will cause **runtime failures** if the user upgrades their panel to 2.9.0 while running the current MCP. **The MCP must be updated.**

### 3.1 Removed user lookup endpoints — CRITICAL

The following endpoints were **deleted without deprecation** in 2.9.0:

| Removed Endpoint | MCP Tool Impact |
|---|---|
| `GET /api/users/by-telegram-id/{telegramId}` | `users_get_by_telegram_id` tool → 404 |
| `GET /api/users/by-email/{email}` | `users_get_by_email` tool → 404 |
| `GET /api/users/by-tag/{tag}` | `users_get_by_tag` tool → 404 |

**Fix:** Use `GET /api/users/stream` with new filter parameters (`telegramId`, `email`, `tag`). The contract already has `REST_API.USERS.STREAM` defined. Rewrite the three tools to use `stream` with filters instead of the removed endpoints.

### 3.2 DELETE endpoints return 204 No Content

**All** DELETE endpoints now return `204 No Content` (no response body) instead of `200` with JSON body `{ "response": { "isDeleted": true } }`.

**Affected MCP tools:** All delete operations — deleting users, nodes, hosts, API tokens, config profiles, squads, snippets, etc.

The MCP's `RemnawaveClient.delete()` method calls `res.json()`, which will **throw** on a 204 response.

**Fix:** Update the `delete()` method in `src/client/index.ts` to handle 204 responses gracefully (return `{ success: true }`).

### 3.3 Bulk operations return 202/204 without response body

Bulk operations (users, nodes, hosts, squads) now return either `202 Accepted` (async) or `204 No Content` (sync) — with **no response body**. Previously they returned JSON like `{ "response": { "affectedRows": N } }`.

Affected endpoints used by MCP:
- `POST /api/users/bulk/*` — all bulk user tools
- `POST /api/nodes/bulk-actions/*` — all bulk node tools
- `POST /api/hosts/bulk/*` — all bulk host tools
- `POST /api/node-plugins/executor`
- `POST /api/internal-squads/{uuid}/bulk-actions/add-users`
- `DELETE /api/internal-squads/{uuid}/bulk-actions/remove-users`
- `POST /api/external-squads/{uuid}/bulk-actions/add-users`
- `DELETE /api/external-squads/{uuid}/bulk-actions/remove-users`

**Fix:** Update the response handling for bulk endpoints. The `RemnawaveClient` should handle 202/204 responses gracefully.

### 3.4 IP Control API renamed to Connections

| Old path (2.8.x) | New path (2.9.0) |
|---|---|
| `POST /api/ip-control/fetch-ips/{userUuid}` | `POST /api/connections/by-user/{userUuid}` |
| `GET /api/ip-control/fetch-ips/result/{jobId}` | `GET /api/connections/by-user/{jobId}` |
| `POST /api/ip-control/fetch-users-ips/{nodeUuid}` | `POST /api/connections/by-node/{nodeUuid}` |
| `GET /api/ip-control/fetch-users-ips/result/{jobId}` | `GET /api/connections/by-node/{jobId}` |
| `POST /api/ip-control/drop-connections` | `POST /api/connections/drop` |

The MCP's `REST_API.IP_CONTROL.*` references point to old paths. Needs contract update.

**Fix:** Update `@remnawave/backend-contract` to >= 2.9.0, OR remap the IP_CONTROL paths in the MCP client.

### 3.5 Keygen: `pubKey` replaced with `secretKey`

`GET /api/keygen` response field `response.pubKey` → `response.secretKey`.

The MCP doesn't directly expose keygen via a tool, but it may appear in resource responses.

### 3.6 POST endpoints now return 201 Created

Most `POST` endpoints now return `201 Created` instead of `200 OK`. The body is unchanged, so this is only an issue if the MCP checks `res.ok` strictly (it uses `fetch` which treats 201 as ok, so **no change needed** here).

### 3.7 User lookup by ID: param type change

`GET /api/users/by-id/{id}` — the `id` path parameter changed from `string` to `integer` (int64). The MCP currently accepts a string UUID pattern for `users_get` tool. If `users_get_by_id` is used, IDs must be numeric.

---

## 4. Required MCP Modifications (summary)

### High Priority (will break at runtime)

| # | Change | Files to modify |
|---|---|---|
| 1 | **Update `@remnawave/backend-contract` to ^2.9.13** | `package.json` |
| 2 | **Handle 204 No Content in DELETE responses** | `src/client/index.ts` (the `delete()` method) |
| 3 | **Handle 202/204 in bulk operation responses** | `src/client/index.ts` (POST methods) |
| 4 | **Replace 3 removed user-lookup tools** (email/tag/telegram) with `stream`-based equivalents | `src/tools/users.ts`, `src/client/index.ts` |

### Medium Priority

| # | Change | Files to modify |
|---|---|---|
| 5 | **Update host tools** — `tags` (array) instead of `tag` (string), remove `allowInsecure`, add `mihomoIpVersion`, add `pinnedPeerCertSha256`/`verifyPeerCertByName` | `src/tools/hosts.ts` |
| 6 | **Update node tools** — add `nodeConsumptionMultiplier`, `note`, `proxyUrl` fields; add `forceRestart` to restart tools | `src/tools/nodes.ts` |
| 7 | **Update user tools** — `trafficLimitBytes` as `z.number()` instead of `z.number().int()` | `src/tools/users.ts` |
| 8 | **Update IP Control** — paths changed (handled by contract update) | `src/client/index.ts` |
| 9 | **Update README** — change API version from 2.7.4 to 2.8.x (or 2.9.x after update) | `README.md` |

### Low Priority

| # | Change | Files to modify |
|---|---|---|
| 10 | Keygen: handle `secretKey` instead of `pubKey` | `src/client/index.ts` |
| 11 | Additional host ALPN/fingerprint values | `src/tools/hosts.ts` |

---

## 5. Sources

1. [Remnawave Panel v2.8.0 Release Notes](https://f.docs.rw/t/178) (Discourse)
2. [Remnawave Panel v2.9.0 Release Notes](https://f.docs.rw/t/354) (Discourse)
3. `@remnawave/backend-contract@2.8.28` — npm package (extracted and inspected)
4. `@remnawave/backend-contract@2.9.13` — npm registry (latest)
5. GitHub Releases: [remnawave/panel/releases](https://github.com/remnawave/panel/releases/tag/2.8.0)
6. MCP source code: `src/client/index.ts`, `src/tools/*.ts`
