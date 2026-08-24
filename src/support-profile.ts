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
    // The support bot's entry point: it knows the sender's Telegram ID and
    // nothing else, and panel 3.x dropped `GET /api/users/by-telegram-id`.
    'users_get_by_telegram_id',
    // Projects this caller's account(s) to subscription URLs only, so the bot
    // can connect a second device without receiving credentials or full users.
    'users_get_subscription_urls_by_telegram_id',
    'users_accessible_nodes',
    'subscriptions_get_by_user_id',
    'subscriptions_get_by_username',
    'subscriptions_get_by_short_uuid',
    'subscription_info',
    'bandwidth_user_usage',
    'hwid_devices_list',
    'hwid_device_delete',
    'hwid_devices_delete_all',
    // Server status, so the bot can answer "is the node I connect through up?".
    // Node objects also carry infrastructure detail, redacted by REDACTED_FIELDS.
    'nodes_list',
    'nodes_get',
]);

/** Resources are a second data channel, gated by the same mechanism. */
export const SUPPORT_RESOURCES: ReadonlySet<string> = new Set(['user-details']);

export const SUPPORT_PROMPTS: ReadonlySet<string> = new Set(['user_audit']);

/**
 * Fields deleted from every panel response in support mode, wherever they
 * appear. Two groups, one mechanism.
 *
 * **Credentials.** `trojanPassword`, `ssPassword` and `vlessUuid` are the
 * scalar credential fields on user records. `links` (string[]) and
 * `ssConfLinks` (Record<string,string>) are `SubscriptionInfoSchema` fields
 * whose values are `vless://`, `trojan://` and `ss://` URIs embedding those
 * same credentials — deleting the three scalar keys does not remove them, so
 * the two collections are deleted wholesale instead.
 *
 * `subscriptionUrl` is deliberately absent: the bot hands out that link.
 *
 * **Infrastructure.** `nodes_list` / `nodes_get` return the whole node record.
 * A user asking "is my server up?" needs `name`, `countryCode`, `isConnected`
 * and `isDisabled`; the rest is operator detail with no reason to reach an LLM
 * context or a support transcript — `address`, `ips`, `port` and `proxyUrl`
 * locate the node, `note` is the admin's own scratchpad, `provider` names the
 * hosting account, `system` carries hostname and CPU model, and `rawInbound`
 * is the raw xray inbound, which for reality holds private keys.
 */
export const REDACTED_FIELDS: readonly string[] = [
    // Credentials
    'trojanPassword',
    'ssPassword',
    'vlessUuid',
    'links',
    'ssConfLinks',
    // Node infrastructure
    'address',
    'ips',
    'port',
    'proxyUrl',
    'note',
    'provider',
    'system',
    'rawInbound',
];
