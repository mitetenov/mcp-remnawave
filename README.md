# mcp-remnawave

[English](#english) | [Русский](#русский)

---

<a id="english"></a>

## MCP Server for Remnawave Panel

MCP server ([Model Context Protocol](https://modelcontextprotocol.io)) providing LLM clients (Claude Desktop, Cursor, Windsurf, etc.) with tools to manage a [Remnawave](https://github.com/remnawave/) VPN panel.

**Version:** 3.2.1 | **Remnawave panel:** 3.3.x (API contract 3.4.x)

### Features

- **179 tools** — full management of users, nodes, hosts, subscriptions, squads, HWID, config profiles, inbounds, API tokens, billing, snippets, external squads, settings, subscription page configs, node plugins, node integrations, shared lists, connections, bandwidth stats, and metadata
- **4 resources** — real-time panel stats, node status, health checks, user details
- **5 prompts** — guided workflows for common tasks
- **Support mode (default)** — restrict to 16 user-facing tools with credentials stripped, for support bots
- **Caddy support** — `X-Api-Key` header for panels behind Caddy with custom path
- **Type-safe** — built on [@remnawave/backend-contract](https://www.npmjs.com/package/@remnawave/backend-contract) for API route validation
- **stdio transport** — works with Claude Desktop, Cursor, Windsurf, and any MCP-compatible client

### Requirements

- Node.js >= 22
- Remnawave panel with API token (Settings > API Tokens)

### Installation

```bash
git clone https://github.com/TrackLine/mcp-remnawave.git
cd mcp-remnawave
npm install
npm run build
```

### Configuration

Create a `.env` file or pass environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `REMNAWAVE_BASE_URL` | Yes | Panel URL (e.g. `https://vpn.example.com`) |
| `REMNAWAVE_API_TOKEN` | Yes | API token from panel settings |
| `REMNAWAVE_API_KEY` | No | API key for Caddy reverse proxy authentication |
| `REMNAWAVE_IS_SUPPORT` | No | Support mode, **on by default**. Set to exactly `false` for full access |
| `REMNAWAVE_TIMEOUT_MS` | No | Per-request timeout in ms (default `30000`). Junk or non-positive values fall back to the default |

```env
REMNAWAVE_BASE_URL=https://vpn.example.com
REMNAWAVE_API_TOKEN=your-api-token-here
```

### Caddy with Custom Path

If your Remnawave panel is deployed behind [Caddy with a custom path and API key protection](https://docs.remnawave.com/docs/security/caddy-with-custom-path/), set the base URL to include the custom path and provide the API key:

```env
REMNAWAVE_BASE_URL=https://example.com/your-secret-path/api
REMNAWAVE_API_KEY=your-caddy-api-key
```

The `X-Api-Key` header will be added to every request automatically.

### Support Mode

The server runs in one of two modes.

**Support mode is the default.** It exposes 16 user-facing tools, 1 resource and
1 prompt, and redacts two groups of fields from every panel response.

*Credentials:* `trojanPassword`, `ssPassword`, `vlessUuid`, `links` and
`ssConfLinks` — the scalar credential fields and the
`vless://`/`trojan://`/`ss://` URI collections that embed them. `subscriptionUrl`
is left intact, since handing out that link is the bot's job.

*Node infrastructure:* `address`, `ips`, `port`, `proxyUrl`, `note`, `provider`,
`system` and `rawInbound`. A user asking whether their server is up needs
`name`, `countryCode`, `isConnected` and `isDisabled`; the rest is operator
detail, down to the raw xray inbound that holds reality private keys.

The only mutating operation is removing HWID devices, which is safe: a device
re-registers on the next connect. Intended for support bots that act on behalf
of an end user.

**Full mode** has no restrictions: all 179 tools, 4 resources, 5 prompts, and
untouched responses. Enable it with `REMNAWAVE_IS_SUPPORT=false`.

The flag is parsed fail-closed — only the exact string `false` unlocks full
mode, so an unset, empty or misspelled value keeps the restricted surface.

Tools available in support mode:

| Category | Tools |
|----------|-------|
| User lookup (5) | `users_resolve`, `users_get`, `users_get_by_username`, `users_get_by_short_uuid`, `users_get_by_telegram_id` |
| Subscription (4) | `subscriptions_get_by_user_id`, `subscriptions_get_by_username`, `subscriptions_get_by_short_uuid`, `subscription_info` |
| Access and usage (2) | `users_accessible_nodes`, `bandwidth_user_usage` |
| Devices (3) | `hwid_devices_list`, `hwid_device_delete`, `hwid_devices_delete_all` |
| Server status (2) | `nodes_list`, `nodes_get` — infrastructure fields redacted |

Resource: `remnawave://users/{userId}`. Prompt: `user_audit`.

> The allowlist reduces blast radius; it is not a security boundary, since the
> process still holds a panel token that can do anything. For a real boundary,
> issue the bot a scoped API token — Remnawave 3.x accepts `scopes` on
> `POST /api/tokens` and lists the catalogue at `GET /api/tokens/scopes`.

### Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "remnawave": {
      "command": "node",
      "args": ["/absolute/path/to/remnawave-mcp/dist/index.js"],
      "env": {
        "REMNAWAVE_BASE_URL": "https://vpn.example.com",
        "REMNAWAVE_API_TOKEN": "your-api-token-here",
        "REMNAWAVE_API_KEY": "your-caddy-api-key",
        "REMNAWAVE_IS_SUPPORT": "false"
      }
    }
  }
}
```

### Usage with Cursor / Windsurf

Add to `.cursor/mcp.json` or `.windsurf/mcp.json` in your project:

```json
{
  "mcpServers": {
    "remnawave": {
      "command": "node",
      "args": ["/absolute/path/to/remnawave-mcp/dist/index.js"],
      "env": {
        "REMNAWAVE_BASE_URL": "https://vpn.example.com",
        "REMNAWAVE_API_TOKEN": "your-api-token-here",
        "REMNAWAVE_API_KEY": "your-caddy-api-key",
        "REMNAWAVE_IS_SUPPORT": "false"
      }
    }
  }
}
```

### Docker

```bash
npm run build
docker compose up -d
```

Environment variables are passed via `.env` file or `docker-compose.yml`.

The container runs the sessionful Streamable HTTP transport on port 3100.
`POST /` initializes a new independent session or routes a request by
`Mcp-Session-Id`; `DELETE /` terminates that session without affecting other
clients. `GET /health` answers `200 {"status":"ok"}` for container liveness.

### Available Tools

#### Users (26 tools)

Users are addressed by their numeric `userId` — the panel dropped user UUIDs in 3.x.

| Tool | Description | Mode |
|------|-------------|------|
| `users_list` | List all users with pagination | read |
| `users_get` | Get user by numeric ID | read |
| `users_get_by_username` | Get user by username | read |
| `users_get_by_short_uuid` | Get user by short UUID | read |
| `users_get_by_telegram_id` | Get users by Telegram ID (returns a list) | read |
| `users_accessible_nodes` | List nodes the user can connect to | read |
| `users_tags_list` | List all user tags | read |
| `users_resolve` | Resolve a user by ID, short UUID or username | read |
| `users_create` | Create a new user | write |
| `users_update` | Update user settings (by id or username) | write |
| `users_delete` | Delete a user | write |
| `users_enable` | Enable a disabled user | write |
| `users_disable` | Disable a user | write |
| `users_revoke_subscription` | Revoke subscription (regenerate link) | write |
| `users_reset_traffic` | Reset traffic counter | write |
| `users_extend_expiration` | Extend expiration date for one user | write |
| `users_bulk_delete_by_status` | Bulk delete users by status | write |
| `users_bulk_update` | Bulk update users | write |
| `users_bulk_reset_traffic` | Bulk reset traffic | write |
| `users_bulk_revoke_subscription` | Bulk revoke subscriptions | write |
| `users_bulk_delete` | Bulk delete users | write |
| `users_bulk_update_squads` | Bulk update user squads | write |
| `users_bulk_extend_expiration` | Bulk extend expiration dates | write |
| `users_bulk_all_update` | Bulk update all users | write |
| `users_bulk_all_reset_traffic` | Bulk reset all users traffic | write |
| `users_bulk_all_extend_expiration` | Bulk extend all users expiration | write |

#### Nodes (15 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `nodes_list` | List all nodes | read |
| `nodes_get` | Get node by UUID | read |
| `nodes_tags_list` | List all node tags | read |
| `nodes_create` | Create a new node | write |
| `nodes_update` | Update node settings | write |
| `nodes_delete` | Delete a node | write |
| `nodes_enable` | Enable a node | write |
| `nodes_disable` | Disable a node | write |
| `nodes_restart` | Restart a specific node | write |
| `nodes_restart_all` | Restart all nodes | write |
| `nodes_reset_traffic` | Reset node traffic counter | write |
| `nodes_reorder` | Reorder nodes | write |
| `nodes_bulk_profile_modification` | Bulk modify node profiles | write |
| `nodes_bulk_actions` | Bulk node actions | write |
| `nodes_bulk_update` | Bulk update nodes | write |

#### Hosts (11 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `hosts_list` | List all hosts | read |
| `hosts_get` | Get host by UUID | read |
| `hosts_tags_list` | List all host tags | read |
| `hosts_create` | Create a new host | write |
| `hosts_update` | Update host settings | write |
| `hosts_delete` | Delete a host | write |
| `hosts_bulk_enable` | Bulk enable hosts | write |
| `hosts_bulk_disable` | Bulk disable hosts | write |
| `hosts_bulk_delete` | Bulk delete hosts | write |
| `hosts_bulk_set_inbound` | Bulk set host inbound | write |
| `hosts_bulk_set_port` | Bulk set host port | write |

#### System (13 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `system_stats` | Panel statistics (users, nodes, traffic, CPU, memory) | read |
| `system_bandwidth_stats` | Bandwidth statistics | read |
| `system_nodes_metrics` | Node metrics | read |
| `system_nodes_statistics` | Node statistics | read |
| `system_health` | Panel health check | read |
| `system_metadata` | Panel version and metadata | read |
| `system_generate_x25519` | Generate X25519 key pair | read |
| `auth_status` | Check authentication status | read |
| `system_stats_recap` | System statistics recap | read |
| `system_stats_digest` | System statistics digest | read |
| `system_http_stats` | HTTP route statistics | read |
| `system_configuration` | Current panel configuration | read |
| `system_srr_matcher` | Test SRR routing rules | read |

#### Subscriptions (10 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `subscriptions_list` | List all subscriptions | read |
| `subscriptions_get_by_user_id` | Get subscription by user ID | read |
| `subscriptions_get_by_username` | Get subscription by username | read |
| `subscriptions_get_by_short_uuid` | Get subscription by short UUID | read |
| `subscriptions_get_raw_by_short_uuid` | Get raw subscription by short UUID | read |
| `subscriptions_get_subpage_config` | Get subscription subpage config | read |
| `subscriptions_get_connection_keys` | Get connection keys by user ID | read |
| `subscription_info` | Get subscription info | read |
| `subscription_request_history_list` | Subscription request history | read |
| `subscription_request_history_stats` | Subscription request history stats | read |

#### Config Profiles & Inbounds (9 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `config_profiles_list` | List config profiles | read |
| `config_profiles_get` | Get config profile by UUID | read |
| `inbounds_list` | List all inbounds | read |
| `config_profiles_get_inbounds` | Get inbounds by profile UUID | read |
| `config_profiles_get_computed_config` | Get computed config by profile UUID | read |
| `config_profiles_create` | Create config profile | write |
| `config_profiles_update` | Update config profile | write |
| `config_profiles_delete` | Delete config profile | write |
| `config_profiles_reorder` | Reorder config profiles | write |

#### Internal Squads (9 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `squads_list` | List all squads | read |
| `squads_accessible_nodes` | Get squad accessible nodes | read |
| `squads_create` | Create a squad | write |
| `squads_update` | Update a squad | write |
| `squads_delete` | Delete a squad | write |
| `squads_add_users` | Add specific users (by ID) to a squad | write |
| `squads_remove_users` | Remove specific users (by ID) from a squad | write |
| `squads_add_all_users` | Add EVERY panel user to a squad | write |
| `squads_remove_all_users` | Remove EVERY user from a squad | write |

#### HWID Devices (7 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `hwid_devices_list` | List HWID devices of a user (by ID) | read |
| `hwid_devices_list_all` | List all HWID devices | read |
| `hwid_stats` | Get HWID statistics | read |
| `hwid_top_users` | Get top users by devices | read |
| `hwid_device_create` | Create HWID device | write |
| `hwid_device_delete` | Delete a specific device | write |
| `hwid_devices_delete_all` | Delete all user's devices | write |

#### API Tokens (4 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `api_tokens_list` | List API tokens | read |
| `api_tokens_create` | Create API token | write |
| `api_tokens_ott` | Get a short-lived token for the backend tools | write |
| `api_tokens_delete` | Delete API token | write |

#### Keygen (1 tool)

| Tool | Description | Mode |
|------|-------------|------|
| `keygen_get` | Get keygen data | read |

#### Infra Billing (12 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `billing_providers_list` | List billing providers | read |
| `billing_provider_get` | Get billing provider by UUID | read |
| `billing_nodes_list` | List billing nodes | read |
| `billing_history_list` | List billing history | read |
| `billing_provider_create` | Create billing provider | write |
| `billing_provider_update` | Update billing provider | write |
| `billing_provider_delete` | Delete billing provider | write |
| `billing_node_create` | Create billing node | write |
| `billing_node_update` | Update billing node | write |
| `billing_node_delete` | Delete billing node | write |
| `billing_history_create` | Create billing history entry | write |
| `billing_history_delete` | Delete billing history entry | write |

#### Snippets (5 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `snippets_list` | List snippets | read |
| `snippets_create` | Create snippet | write |
| `snippets_update` | Update snippet | write |
| `snippets_sync` | Sync snippet to config profiles that use it | write |
| `snippets_delete` | Delete snippet | write |

#### External Squads (8 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `external_squads_list` | List external squads | read |
| `external_squads_get` | Get external squad by UUID | read |
| `external_squads_create` | Create external squad | write |
| `external_squads_update` | Update external squad | write |
| `external_squads_delete` | Delete external squad | write |
| `external_squads_add_all_users` | Add EVERY panel user to an external squad | write |
| `external_squads_remove_all_users` | Remove EVERY user from an external squad | write |
| `external_squads_reorder` | Reorder external squads | write |

#### Settings (2 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `settings_get` | Get panel settings | read |
| `settings_update` | Update panel settings | write |

#### Subscription Page Configs (7 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `sub_page_configs_list` | List subscription page configs | read |
| `sub_page_configs_get` | Get subscription page config | read |
| `sub_page_configs_create` | Create subscription page config | write |
| `sub_page_configs_update` | Update subscription page config | write |
| `sub_page_configs_delete` | Delete subscription page config | write |
| `sub_page_configs_reorder` | Reorder subscription page configs | write |
| `sub_page_configs_clone` | Clone subscription page config | write |

#### Node Plugins (18 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `node_plugins_list` | List node plugins | read |
| `node_plugins_get` | Get node plugin by UUID | read |
| `node_plugins_shared_lists_list` | List shared lists | read |
| `node_plugins_shared_lists_get` | Get shared list by UUID | read |
| `node_plugins_torrent_reports` | Get torrent blocker reports | read |
| `node_plugins_torrent_stats` | Get torrent blocker stats | read |
| `node_plugins_create` | Create node plugin | write |
| `node_plugins_update` | Update node plugin | write |
| `node_plugins_delete` | Delete node plugin | write |
| `node_plugins_reorder` | Reorder node plugins | write |
| `node_plugins_clone` | Clone node plugin | write |
| `node_plugins_execute` | Execute node plugin | write |
| `node_plugins_sync` | Push plugin config to its nodes | write |
| `node_plugins_shared_lists_create` | Create shared list | write |
| `node_plugins_shared_lists_update` | Update shared list | write |
| `node_plugins_shared_lists_delete` | Delete shared list | write |
| `node_plugins_shared_lists_sync` | Push shared list to its nodes | write |
| `node_plugins_torrent_truncate` | Truncate torrent blocker reports | write |

#### Node Integrations (5 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `node_integrations_list` | List node integrations | read |
| `node_integrations_get` | Get node integration by UUID | read |
| `node_integrations_create` | Create node integration | write |
| `node_integrations_update` | Update node integration | write |
| `node_integrations_delete` | Delete node integration | write |

#### Connections (7 tools)

Replaces the `ip_control_*` tools removed in Remnawave 3.x.

| Tool | Description | Mode |
|------|-------------|------|
| `connections_by_user` | Request connections for a user (async job) | read |
| `connections_by_user_result` | Get by-user job result | read |
| `connections_by_node` | Request connections on a node (async job) | read |
| `connections_by_node_result` | Get by-node job result | read |
| `connections_geocheck_by_node` | Run a geolocation check for a node | read |
| `connections_geocheck_by_node_result` | Get geolocation check result | read |
| `connections_drop` | Drop connections by user ID or IP | write |

#### Bandwidth Stats (6 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `bandwidth_nodes_list` | Bandwidth usage per node | read |
| `bandwidth_nodes_realtime` | Realtime bandwidth usage per node | read |
| `bandwidth_user_usage` | Bandwidth usage for one user | read |
| `bandwidth_nodes_usage` | Users over a traffic threshold on given nodes | read |
| `bandwidth_squad_usage` | Internal squad users usage over a period | read |
| `bandwidth_squad_user_usage` | Daily usage of one user on squad nodes | read |

#### Metadata (4 tools)

| Tool | Description | Mode |
|------|-------------|------|
| `metadata_node_get` | Get node metadata | read |
| `metadata_user_get` | Get user metadata (by user ID) | read |
| `metadata_node_upsert` | Upsert node metadata | write |
| `metadata_user_upsert` | Upsert user metadata (by user ID) | write |

### Resources

| URI | Description |
|-----|-------------|
| `remnawave://stats` | Current panel statistics |
| `remnawave://nodes` | All nodes status |
| `remnawave://health` | Panel health status |
| `remnawave://users/{userId}` | Specific user details |

### Prompts

| Prompt | Description |
|--------|-------------|
| `create_user_wizard` | Step-by-step user creation guide |
| `node_diagnostics` | Node troubleshooting |
| `traffic_report` | Traffic usage report |
| `user_audit` | Complete user audit |
| `bulk_user_cleanup` | Find and manage expired users |

### Example Queries

```
"Show me all users with expired subscriptions"
"Create user vasya with 50 GB limit for one month"
"Restart node amsterdam-01"
"Give me a traffic report for the last week"
"Disable users who exceeded their traffic limit"
"Which nodes are offline right now?"
"Show billing history"
"List all node plugins"
"Get active connections for user 42"
```

### Project Structure

```
src/
├── index.ts                       # Entry point (stdio transport)
├── http-index.ts                  # Entry point (HTTP transport)
├── http-handler.ts                # HTTP routing: MCP endpoint + /health
├── server.ts                      # McpServer setup
├── config.ts                      # Environment config
├── client/
│   └── index.ts                   # Remnawave HTTP client
├── tools/
│   ├── helpers.ts                 # Result formatting helpers
│   ├── index.ts                   # Tool registration
│   ├── users.ts                   # User management (26 tools)
│   ├── node-plugins.ts            # Node plugins & shared lists (18 tools)
│   ├── nodes.ts                   # Node management (15 tools)
│   ├── system.ts                  # System & auth (13 tools)
│   ├── infra-billing.ts           # Infrastructure billing (12 tools)
│   ├── hosts.ts                   # Host management (11 tools)
│   ├── subscriptions.ts           # Subscriptions (10 tools)
│   ├── inbounds.ts                # Config profiles & inbounds (9 tools)
│   ├── squads.ts                  # Internal squads (9 tools)
│   ├── external-squads.ts         # External squads (8 tools)
│   ├── connections.ts             # Connections & geocheck (7 tools)
│   ├── hwid.ts                    # HWID devices (7 tools)
│   ├── subscription-page-configs.ts # Subscription page configs (7 tools)
│   ├── bandwidth.ts               # Bandwidth stats (6 tools)
│   ├── node-integrations.ts       # Node integrations (5 tools)
│   ├── snippets.ts                # Snippets (5 tools)
│   ├── api-tokens.ts              # API tokens (4 tools)
│   ├── metadata.ts                # Node & user metadata (4 tools)
│   ├── settings.ts                # Panel settings (2 tools)
│   └── keygen.ts                  # Keygen (1 tool)
├── resources/
│   └── index.ts                   # MCP resources
└── prompts/
    └── index.ts                   # MCP prompts
```

### License

MIT

---

<a id="русский"></a>

## MCP-сервер для Remnawave Panel

MCP-сервер ([Model Context Protocol](https://modelcontextprotocol.io)), предоставляющий LLM-клиентам (Claude Desktop, Cursor, Windsurf и др.) инструменты для управления VPN-панелью [Remnawave](https://github.com/remnawave/).

**Версия:** 3.2.1 | **Панель Remnawave:** 3.3.x (контракт API 3.4.x)

### Возможности

- **179 инструментов** — полное управление пользователями, нодами, хостами, подписками, группами, HWID, конфиг-профилями, inbounds, API-токенами, биллингом, сниппетами, внешними группами, настройками, страницами подписок, плагинами нод, интеграциями нод, общими списками, соединениями, статистикой трафика и метаданными
- **4 ресурса** — статистика панели, статус нод, проверка здоровья, данные пользователя в реальном времени
- **5 промптов** — пошаговые сценарии для типичных задач
- **Режим support (по умолчанию)** — 16 пользовательских инструментов с вырезанными кредами, для саппорт-ботов
- **Поддержка Caddy** — заголовок `X-Api-Key` для панелей за Caddy с кастомным путём
- **Type-safe** — построен на [@remnawave/backend-contract](https://www.npmjs.com/package/@remnawave/backend-contract) для валидации API-маршрутов
- **stdio транспорт** — работает с Claude Desktop, Cursor, Windsurf и любым MCP-совместимым клиентом

### Требования

- Node.js >= 22
- Remnawave панель с API-токеном (Настройки > API Tokens)

### Установка

```bash
git clone https://github.com/TrackLine/mcp-remnawave.git
cd mcp-remnawave
npm install
npm run build
```

### Конфигурация

Создайте файл `.env` или передайте переменные окружения:

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `REMNAWAVE_BASE_URL` | Да | URL панели (например `https://vpn.example.com`) |
| `REMNAWAVE_API_TOKEN` | Да | API-токен из настроек панели |
| `REMNAWAVE_API_KEY` | Нет | API-ключ для аутентификации через Caddy reverse proxy |
| `REMNAWAVE_IS_SUPPORT` | Нет | Режим support, **включён по умолчанию**. Ровно `false` — полный доступ |
| `REMNAWAVE_TIMEOUT_MS` | Нет | Таймаут запроса в мс (по умолчанию `30000`). Мусорное или неположительное значение — откат к дефолту |

```env
REMNAWAVE_BASE_URL=https://vpn.example.com
REMNAWAVE_API_TOKEN=ваш-api-токен
```

### Caddy с кастомным путём

Если ваша панель Remnawave развёрнута за [Caddy с кастомным путём и защитой API-ключом](https://docs.remnawave.com/docs/security/caddy-with-custom-path/), укажите полный путь в base URL и предоставьте API-ключ:

```env
REMNAWAVE_BASE_URL=https://example.com/your-secret-path/api
REMNAWAVE_API_KEY=ваш-caddy-api-ключ
```

Заголовок `X-Api-Key` будет автоматически добавляться к каждому запросу.

### Режим Support

Сервер работает в одном из двух режимов.

**Support — режим по умолчанию.** Открыто 16 пользовательских инструментов,
1 ресурс и 1 промпт, а из каждого ответа панели вырезаются две группы полей.

*Учётные данные:* `trojanPassword`, `ssPassword`, `vlessUuid`, `links` и
`ssConfLinks` — скалярные поля и коллекции ссылок
`vless://`/`trojan://`/`ss://`, в которые эти же данные встроены.
`subscriptionUrl` остаётся нетронутым: выдавать эту ссылку — задача бота.

*Инфраструктура нод:* `address`, `ips`, `port`, `proxyUrl`, `note`, `provider`,
`system` и `rawInbound`. Пользователю, который спрашивает «работает ли мой
сервер», нужны `name`, `countryCode`, `isConnected` и `isDisabled`; остальное —
операторские детали вплоть до сырого xray-inbound с приватными ключами reality.

Единственная операция записи — удаление HWID-устройств; она безопасна,
устройство снова появится при следующем подключении. Режим рассчитан на
саппорт-ботов, действующих от имени пользователя.

**Full — без ограничений:** все 179 инструментов, 4 ресурса, 5 промптов,
ответы не трогаются. Включается через `REMNAWAVE_IS_SUPPORT=false`.

Флаг разбирается fail-closed: полный режим включает только точная строка
`false`, а пустое, отсутствующее или написанное с опечаткой значение оставляет
урезанную поверхность.

Инструменты в режиме support:

| Категория | Инструменты |
|-----------|-------------|
| Поиск пользователя (5) | `users_resolve`, `users_get`, `users_get_by_username`, `users_get_by_short_uuid`, `users_get_by_telegram_id` |
| Подписка (4) | `subscriptions_get_by_user_id`, `subscriptions_get_by_username`, `subscriptions_get_by_short_uuid`, `subscription_info` |
| Доступ и расход (2) | `users_accessible_nodes`, `bandwidth_user_usage` |
| Устройства (3) | `hwid_devices_list`, `hwid_device_delete`, `hwid_devices_delete_all` |
| Статус серверов (2) | `nodes_list`, `nodes_get` — инфраструктурные поля вырезаны |

Ресурс: `remnawave://users/{userId}`. Промпт: `user_audit`.

> Allowlist уменьшает радиус поражения, но не является границей безопасности:
> процесс всё ещё держит токен панели, которым можно всё. Настоящая граница —
> скоупнутый API-токен: Remnawave 3.x принимает `scopes` в `POST /api/tokens`
> и отдаёт каталог в `GET /api/tokens/scopes`.

### Использование с Claude Desktop

Добавьте в конфигурацию Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` на macOS):

```json
{
  "mcpServers": {
    "remnawave": {
      "command": "node",
      "args": ["/абсолютный/путь/к/remnawave-mcp/dist/index.js"],
      "env": {
        "REMNAWAVE_BASE_URL": "https://vpn.example.com",
        "REMNAWAVE_API_TOKEN": "ваш-api-токен",
        "REMNAWAVE_API_KEY": "ваш-caddy-api-ключ",
        "REMNAWAVE_IS_SUPPORT": "false"
      }
    }
  }
}
```

### Использование с Cursor / Windsurf

Добавьте в `.cursor/mcp.json` или `.windsurf/mcp.json` вашего проекта:

```json
{
  "mcpServers": {
    "remnawave": {
      "command": "node",
      "args": ["/абсолютный/путь/к/remnawave-mcp/dist/index.js"],
      "env": {
        "REMNAWAVE_BASE_URL": "https://vpn.example.com",
        "REMNAWAVE_API_TOKEN": "ваш-api-токен",
        "REMNAWAVE_API_KEY": "ваш-caddy-api-ключ",
        "REMNAWAVE_IS_SUPPORT": "false"
      }
    }
  }
}
```

### Docker

```bash
npm run build
docker compose up -d
```

Переменные окружения передаются через `.env` файл или `docker-compose.yml`.

В контейнере работает sessionful Streamable HTTP-транспорт на порту 3100.
`POST /` создаёт независимую сессию или маршрутизирует запрос по
`Mcp-Session-Id`; `DELETE /` завершает только указанную сессию, не затрагивая
других клиентов. `GET /health` возвращает `200 {"status":"ok"}` для проверки
живости контейнера.

### Доступные инструменты

#### Пользователи (26 инструментов)

Пользователь адресуется числовым `userId` — в 3.x панель отказалась от UUID пользователей.

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `users_list` | Список пользователей с пагинацией | read |
| `users_get` | Получить пользователя по числовому ID | read |
| `users_get_by_username` | Получить пользователя по username | read |
| `users_get_by_short_uuid` | Получить пользователя по short UUID | read |
| `users_get_by_telegram_id` | Получить пользователей по Telegram ID (список) | read |
| `users_accessible_nodes` | Ноды, доступные пользователю | read |
| `users_tags_list` | Список тегов пользователей | read |
| `users_resolve` | Найти пользователя по ID, short UUID или username | read |
| `users_create` | Создать нового пользователя | write |
| `users_update` | Обновить пользователя (по id или username) | write |
| `users_delete` | Удалить пользователя | write |
| `users_enable` | Включить пользователя | write |
| `users_disable` | Отключить пользователя | write |
| `users_revoke_subscription` | Отозвать подписку (перегенерировать ссылку) | write |
| `users_reset_traffic` | Сбросить счётчик трафика | write |
| `users_extend_expiration` | Продлить срок одному пользователю | write |
| `users_bulk_delete_by_status` | Массовое удаление по статусу | write |
| `users_bulk_update` | Массовое обновление | write |
| `users_bulk_reset_traffic` | Массовый сброс трафика | write |
| `users_bulk_revoke_subscription` | Массовый отзыв подписок | write |
| `users_bulk_delete` | Массовое удаление | write |
| `users_bulk_update_squads` | Массовое обновление групп | write |
| `users_bulk_extend_expiration` | Массовое продление срока | write |
| `users_bulk_all_update` | Обновить всех пользователей | write |
| `users_bulk_all_reset_traffic` | Сбросить трафик всех пользователей | write |
| `users_bulk_all_extend_expiration` | Продлить срок всех пользователей | write |

#### Ноды (15 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `nodes_list` | Список всех нод | read |
| `nodes_get` | Получить ноду по UUID | read |
| `nodes_tags_list` | Список тегов нод | read |
| `nodes_create` | Создать новую ноду | write |
| `nodes_update` | Обновить настройки ноды | write |
| `nodes_delete` | Удалить ноду | write |
| `nodes_enable` | Включить ноду | write |
| `nodes_disable` | Отключить ноду | write |
| `nodes_restart` | Перезапустить ноду | write |
| `nodes_restart_all` | Перезапустить все ноды | write |
| `nodes_reset_traffic` | Сбросить трафик ноды | write |
| `nodes_reorder` | Переупорядочить ноды | write |
| `nodes_bulk_profile_modification` | Массовое изменение профилей нод | write |
| `nodes_bulk_actions` | Массовые действия с нодами | write |
| `nodes_bulk_update` | Массовое обновление нод | write |

#### Хосты (11 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `hosts_list` | Список всех хостов | read |
| `hosts_get` | Получить хост по UUID | read |
| `hosts_tags_list` | Список тегов хостов | read |
| `hosts_create` | Создать новый хост | write |
| `hosts_update` | Обновить настройки хоста | write |
| `hosts_delete` | Удалить хост | write |
| `hosts_bulk_enable` | Массовое включение хостов | write |
| `hosts_bulk_disable` | Массовое отключение хостов | write |
| `hosts_bulk_delete` | Массовое удаление хостов | write |
| `hosts_bulk_set_inbound` | Массовая установка inbound | write |
| `hosts_bulk_set_port` | Массовая установка порта | write |

#### Система (13 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `system_stats` | Статистика панели (пользователи, ноды, трафик, CPU, память) | read |
| `system_bandwidth_stats` | Статистика пропускной способности | read |
| `system_nodes_metrics` | Метрики нод | read |
| `system_nodes_statistics` | Статистика нод | read |
| `system_health` | Проверка здоровья панели | read |
| `system_metadata` | Версия и метаданные панели | read |
| `system_generate_x25519` | Генерация пары ключей X25519 | read |
| `auth_status` | Проверка статуса аутентификации | read |
| `system_stats_recap` | Обзор статистики | read |
| `system_stats_digest` | Сводка статистики | read |
| `system_http_stats` | Статистика HTTP-маршрутов | read |
| `system_configuration` | Текущая конфигурация панели | read |
| `system_srr_matcher` | Тест SRR-правил маршрутизации | read |

#### Подписки (10 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `subscriptions_list` | Список всех подписок | read |
| `subscriptions_get_by_user_id` | Подписка по ID пользователя | read |
| `subscriptions_get_by_username` | Подписка по username | read |
| `subscriptions_get_by_short_uuid` | Подписка по short UUID | read |
| `subscriptions_get_raw_by_short_uuid` | Сырая подписка по short UUID | read |
| `subscriptions_get_subpage_config` | Конфиг субстраницы подписки | read |
| `subscriptions_get_connection_keys` | Ключи подключения по ID пользователя | read |
| `subscription_info` | Информация о подписке | read |
| `subscription_request_history_list` | История запросов подписок | read |
| `subscription_request_history_stats` | Статистика запросов подписок | read |

#### Конфиг-профили и Inbounds (9 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `config_profiles_list` | Список конфиг-профилей | read |
| `config_profiles_get` | Получить конфиг-профиль по UUID | read |
| `inbounds_list` | Список всех inbounds | read |
| `config_profiles_get_inbounds` | Inbounds по UUID профиля | read |
| `config_profiles_get_computed_config` | Вычисленный конфиг по UUID профиля | read |
| `config_profiles_create` | Создать конфиг-профиль | write |
| `config_profiles_update` | Обновить конфиг-профиль | write |
| `config_profiles_delete` | Удалить конфиг-профиль | write |
| `config_profiles_reorder` | Переупорядочить конфиг-профили | write |

#### Внутренние группы (9 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `squads_list` | Список групп | read |
| `squads_accessible_nodes` | Доступные ноды группы | read |
| `squads_create` | Создать группу | write |
| `squads_update` | Обновить группу | write |
| `squads_delete` | Удалить группу | write |
| `squads_add_users` | Добавить конкретных пользователей (по ID) | write |
| `squads_remove_users` | Убрать конкретных пользователей (по ID) | write |
| `squads_add_all_users` | Добавить ВСЕХ пользователей панели в группу | write |
| `squads_remove_all_users` | Убрать ВСЕХ пользователей из группы | write |

#### HWID-устройства (7 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `hwid_devices_list` | Список устройств пользователя (по ID) | read |
| `hwid_devices_list_all` | Список всех устройств | read |
| `hwid_stats` | Статистика HWID | read |
| `hwid_top_users` | Топ пользователей по устройствам | read |
| `hwid_device_create` | Создать HWID-устройство | write |
| `hwid_device_delete` | Удалить конкретное устройство | write |
| `hwid_devices_delete_all` | Удалить все устройства пользователя | write |

#### API-токены (4 инструмента)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `api_tokens_list` | Список API-токенов | read |
| `api_tokens_create` | Создать API-токен | write |
| `api_tokens_ott` | Короткоживущий токен для backend-инструментов | write |
| `api_tokens_delete` | Удалить API-токен | write |

#### Keygen (1 инструмент)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `keygen_get` | Получить данные keygen | read |

#### Биллинг инфраструктуры (12 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `billing_providers_list` | Список провайдеров биллинга | read |
| `billing_provider_get` | Получить провайдера по UUID | read |
| `billing_nodes_list` | Список биллинговых нод | read |
| `billing_history_list` | История биллинга | read |
| `billing_provider_create` | Создать провайдера | write |
| `billing_provider_update` | Обновить провайдера | write |
| `billing_provider_delete` | Удалить провайдера | write |
| `billing_node_create` | Создать биллинговую ноду | write |
| `billing_node_update` | Обновить биллинговую ноду | write |
| `billing_node_delete` | Удалить биллинговую ноду | write |
| `billing_history_create` | Создать запись истории | write |
| `billing_history_delete` | Удалить запись истории | write |

#### Сниппеты (5 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `snippets_list` | Список сниппетов | read |
| `snippets_create` | Создать сниппет | write |
| `snippets_update` | Обновить сниппет | write |
| `snippets_sync` | Разослать сниппет в использующие его конфиг-профили | write |
| `snippets_delete` | Удалить сниппет | write |

#### Внешние группы (8 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `external_squads_list` | Список внешних групп | read |
| `external_squads_get` | Получить внешнюю группу по UUID | read |
| `external_squads_create` | Создать внешнюю группу | write |
| `external_squads_update` | Обновить внешнюю группу | write |
| `external_squads_delete` | Удалить внешнюю группу | write |
| `external_squads_add_all_users` | Добавить ВСЕХ пользователей панели | write |
| `external_squads_remove_all_users` | Убрать ВСЕХ пользователей | write |
| `external_squads_reorder` | Переупорядочить | write |

#### Настройки (2 инструмента)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `settings_get` | Получить настройки панели | read |
| `settings_update` | Обновить настройки панели | write |

#### Страницы подписок (7 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `sub_page_configs_list` | Список конфигов страниц | read |
| `sub_page_configs_get` | Получить конфиг страницы | read |
| `sub_page_configs_create` | Создать конфиг страницы | write |
| `sub_page_configs_update` | Обновить конфиг страницы | write |
| `sub_page_configs_delete` | Удалить конфиг страницы | write |
| `sub_page_configs_reorder` | Переупорядочить | write |
| `sub_page_configs_clone` | Клонировать конфиг | write |

#### Плагины нод (18 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `node_plugins_list` | Список плагинов | read |
| `node_plugins_get` | Получить плагин по UUID | read |
| `node_plugins_shared_lists_list` | Список общих списков | read |
| `node_plugins_shared_lists_get` | Общий список по UUID | read |
| `node_plugins_torrent_reports` | Отчёты торрент-блокировщика | read |
| `node_plugins_torrent_stats` | Статистика торрент-блокировщика | read |
| `node_plugins_create` | Создать плагин | write |
| `node_plugins_update` | Обновить плагин | write |
| `node_plugins_delete` | Удалить плагин | write |
| `node_plugins_reorder` | Переупорядочить плагины | write |
| `node_plugins_clone` | Клонировать плагин | write |
| `node_plugins_execute` | Выполнить плагин | write |
| `node_plugins_sync` | Разослать конфиг плагина на его ноды | write |
| `node_plugins_shared_lists_create` | Создать общий список | write |
| `node_plugins_shared_lists_update` | Обновить общий список | write |
| `node_plugins_shared_lists_delete` | Удалить общий список | write |
| `node_plugins_shared_lists_sync` | Разослать общий список на ноды | write |
| `node_plugins_torrent_truncate` | Очистить отчёты торрент-блокировщика | write |

#### Интеграции нод (5 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `node_integrations_list` | Список интеграций | read |
| `node_integrations_get` | Интеграция по UUID | read |
| `node_integrations_create` | Создать интеграцию | write |
| `node_integrations_update` | Обновить интеграцию | write |
| `node_integrations_delete` | Удалить интеграцию | write |

#### Соединения (7 инструментов)

Заменяют инструменты `ip_control_*`, удалённые в Remnawave 3.x.

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `connections_by_user` | Запросить соединения пользователя (async job) | read |
| `connections_by_user_result` | Результат задачи по пользователю | read |
| `connections_by_node` | Запросить соединения на ноде (async job) | read |
| `connections_by_node_result` | Результат задачи по ноде | read |
| `connections_geocheck_by_node` | Геопроверка ноды | read |
| `connections_geocheck_by_node_result` | Результат геопроверки | read |
| `connections_drop` | Сбросить соединения по ID пользователя или IP | write |

#### Статистика трафика (6 инструментов)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `bandwidth_nodes_list` | Трафик по нодам | read |
| `bandwidth_nodes_realtime` | Трафик по нодам в реальном времени | read |
| `bandwidth_user_usage` | Трафик одного пользователя | read |
| `bandwidth_nodes_usage` | Пользователи выше порога трафика на нодах | read |
| `bandwidth_squad_usage` | Трафик пользователей группы за период | read |
| `bandwidth_squad_user_usage` | Дневной трафик пользователя на нодах группы | read |

#### Метаданные (4 инструмента)

| Инструмент | Описание | Режим |
|------------|----------|-------|
| `metadata_node_get` | Получить метаданные ноды | read |
| `metadata_user_get` | Метаданные пользователя (по ID) | read |
| `metadata_node_upsert` | Обновить метаданные ноды | write |
| `metadata_user_upsert` | Обновить метаданные пользователя (по ID) | write |

### Ресурсы

| URI | Описание |
|-----|----------|
| `remnawave://stats` | Текущая статистика панели |
| `remnawave://nodes` | Статус всех нод |
| `remnawave://health` | Состояние здоровья панели |
| `remnawave://users/{userId}` | Данные конкретного пользователя |

### Промпты

| Промпт | Описание |
|--------|----------|
| `create_user_wizard` | Пошаговое создание пользователя |
| `node_diagnostics` | Диагностика ноды |
| `traffic_report` | Отчёт по трафику |
| `user_audit` | Полный аудит пользователя |
| `bulk_user_cleanup` | Поиск и управление просроченными пользователями |

### Примеры запросов

```
«Покажи мне всех пользователей с истёкшей подпиской»
«Создай пользователя vasya с лимитом 50 ГБ на месяц»
«Перезапусти ноду amsterdam-01»
«Дай отчёт по трафику за последнюю неделю»
«Отключи пользователей, которые превысили лимит трафика»
«Какие ноды сейчас офлайн?»
«Покажи историю биллинга»
«Список плагинов нод»
«Покажи активные соединения пользователя 42»
```

### Структура проекта

```
src/
├── index.ts                       # Точка входа (stdio транспорт)
├── http-index.ts                  # Точка входа (HTTP транспорт)
├── http-handler.ts                # HTTP-роутинг: MCP-эндпоинт + /health
├── server.ts                      # Настройка McpServer
├── config.ts                      # Конфигурация окружения
├── client/
│   └── index.ts                   # HTTP-клиент Remnawave
├── tools/
│   ├── helpers.ts                 # Хелперы форматирования
│   ├── index.ts                   # Регистрация инструментов
│   ├── users.ts                   # Управление пользователями (26)
│   ├── node-plugins.ts            # Плагины нод и общие списки (18)
│   ├── nodes.ts                   # Управление нодами (15)
│   ├── system.ts                  # Система и авторизация (13)
│   ├── infra-billing.ts           # Биллинг инфраструктуры (12)
│   ├── hosts.ts                   # Управление хостами (11)
│   ├── subscriptions.ts           # Подписки (10)
│   ├── inbounds.ts                # Конфиг-профили и inbounds (9)
│   ├── squads.ts                  # Внутренние группы (9)
│   ├── external-squads.ts         # Внешние группы (8)
│   ├── connections.ts             # Соединения и геопроверка (7)
│   ├── hwid.ts                    # HWID-устройства (7)
│   ├── subscription-page-configs.ts # Страницы подписок (7)
│   ├── bandwidth.ts               # Статистика трафика (6)
│   ├── node-integrations.ts       # Интеграции нод (5)
│   ├── snippets.ts                # Сниппеты (5)
│   ├── api-tokens.ts              # API-токены (4)
│   ├── metadata.ts                # Метаданные нод и пользователей (4)
│   ├── settings.ts                # Настройки панели (2)
│   └── keygen.ts                  # Keygen (1)
├── resources/
│   └── index.ts                   # MCP-ресурсы
└── prompts/
    └── index.ts                   # MCP-промпты
```

### Лицензия

MIT
