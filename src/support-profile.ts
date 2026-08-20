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
 * Working VPN credentials, and the collections that carry them as URIs.
 * Stripped from every panel response in support mode, so an ordinary user or
 * subscription lookup cannot place them in the LLM context.
 *
 * `trojanPassword`, `ssPassword` and `vlessUuid` are the scalar credential
 * fields on user records. `links` (string[]) and `ssConfLinks`
 * (Record<string,string>) are `SubscriptionInfoSchema` fields whose values
 * are `vless://`, `trojan://` and `ss://` URIs embedding those same
 * credentials — deleting the three scalar keys does not remove them, so the
 * two collections are deleted wholesale instead.
 *
 * `subscriptionUrl` is deliberately absent: the bot hands out that link.
 */
export const REDACTED_FIELDS: readonly string[] = [
    'trojanPassword',
    'ssPassword',
    'vlessUuid',
    'links',
    'ssConfLinks',
];
