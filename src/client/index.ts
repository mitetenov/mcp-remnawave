import { REST_API } from '@remnawave/backend-contract';
import type {
    CreateUserCommand,
    UpdateUserCommand,
    ResolveUserCommand,
    ExtendUserCommand,
    BulkDeleteUsersByStatusCommand,
    BulkUpdateUsersCommand,
    BulkResetTrafficUsersCommand,
    BulkRevokeUsersSubscriptionCommand,
    BulkDeleteUsersCommand,
    BulkUpdateUsersSquadsCommand,
    BulkExtendExpirationDateCommand,
    BulkAllUpdateUsersCommand,
    BulkAllExtendExpirationDateCommand,
    CreateNodeCommand,
    UpdateNodeCommand,
    ReorderNodesCommand,
    BulkNodesProfileModificationCommand,
    BulkNodesActionsCommand,
    BulkNodesUpdateCommand,
    CreateHostCommand,
    UpdateHostCommand,
    BulkEnableHostsCommand,
    BulkDisableHostsCommand,
    BulkDeleteHostsCommand,
    UpdateManyHostsCommand,
    CreateConfigProfileCommand,
    UpdateConfigProfileCommand,
    ReorderConfigProfileCommand,
    CreateInternalSquadCommand,
    UpdateInternalSquadCommand,
    AddManyUsersToInternalSquadCommand,
    DeleteManyUsersFromInternalSquadCommand,
    CreateUserHwidDeviceCommand,
    DeleteUserHwidDeviceCommand,
    DeleteAllUserHwidDevicesCommand,
    CreateInfraBillingRecordCommand,
    CreateInfraBillingNodeCommand,
    CreateInfraProviderCommand,
    UpdateInfraBillingNodeCommand,
    UpdateInfraProviderCommand,
    CreateSnippetCommand,
    UpdateSnippetCommand,
    DeleteSnippetCommand,
    SyncSnippetCommand,
    CreateExternalSquadCommand,
    UpdateExternalSquadCommand,
    ReorderExternalSquadCommand,
    UpdateRemnawaveSettingsCommand,
    CreateSubpageConfigCommand,
    UpdateSubpageConfigCommand,
    CloneSubpageConfigCommand,
    ReorderSubpageConfigsCommand,
    CreateNodePluginCommand,
    UpdateNodePluginCommand,
    ReorderNodePluginCommand,
    CloneNodePluginCommand,
    SyncNodePluginCommand,
    PluginExecutorCommand,
    CreateSharedListCommand,
    UpdateSharedListCommand,
    SyncSharedListCommand,
    CreateNodeIntegrationCommand,
    UpdateNodeIntegrationCommand,
    CreateApiTokenCommand,
    DropConnectionsCommand,
    TestSrrMatcherCommand,
    GetNodeUsageCommand,
} from '@remnawave/backend-contract';
import { Config, DEFAULT_TIMEOUT_MS, isConfigured } from '../config.js';
import { REDACTED_FIELDS } from '../support-profile.js';

/**
 * Deletes redacted fields in place, everywhere they appear. The value comes
 * straight from `res.json()` on every call, so nothing else holds a reference
 * to it and mutating is safe.
 */
function stripRedactedFields(value: unknown): void {
    if (Array.isArray(value)) {
        for (const item of value) {
            stripRedactedFields(item);
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
        stripRedactedFields(nested);
    }
}

export class RemnawaveClient {
    private baseUrl: string;
    private headers: Record<string, string>;
    private configured: boolean;
    private isSupport: boolean;
    private timeoutMs: number;

    constructor(config: Config) {
        this.baseUrl = config.baseUrl;
        this.configured = isConfigured(config);
        this.isSupport = config.isSupport;
        this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.headers = {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
        };
        if (config.apiKey) {
            this.headers['X-Api-Key'] = config.apiKey;
        }
    }

    /** Whether this client is restricted to the support-bot surface. */
    get isSupportMode(): boolean {
        return this.isSupport;
    }

    private async request<T = unknown>(
        method: string,
        path: string,
        body?: unknown,
    ): Promise<T> {
        if (!this.configured) {
            throw new Error(
                'MCP server is not configured. Set REMNAWAVE_BASE_URL and REMNAWAVE_API_TOKEN environment variables.',
            );
        }
        const url = `${this.baseUrl}${path}`;
        const options: RequestInit = {
            method,
            headers: this.headers,
            // Without this a stalled panel stalls the caller's tool call for
            // as long as the connection stays open.
            signal: AbortSignal.timeout(this.timeoutMs),
        };
        if (body !== undefined) {
            options.body = JSON.stringify(body);
        }
        let res: Response;
        try {
            res = await fetch(url, options);
        } catch (e) {
            // AbortSignal.timeout aborts with a TimeoutError whose message is
            // just "The operation was aborted" — useless to whoever reads the
            // tool result, so say what actually timed out.
            if (e instanceof Error && e.name === 'TimeoutError') {
                throw new Error(
                    `Remnawave API timeout: ${method} ${path} did not respond within ${this.timeoutMs}ms`,
                );
            }
            throw e;
        }
        if (!res.ok) {
            let errorMessage: string;
            try {
                const errorBody = await res.json();
                errorMessage =
                    (errorBody as { message?: string }).message ||
                    JSON.stringify(errorBody);
            } catch {
                errorMessage = `HTTP ${res.status} ${res.statusText}`;
            }
            throw new Error(`Remnawave API error: ${errorMessage}`);
        }
        const data = (await res.json()) as T;
        if (this.isSupport) {
            stripRedactedFields(data);
        }
        return data;
    }

    private async get<T = unknown>(path: string): Promise<T> {
        return this.request<T>('GET', path);
    }

    private async post<T = unknown>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('POST', path, body);
    }

    private async patch<T = unknown>(
        path: string,
        body?: unknown,
    ): Promise<T> {
        return this.request<T>('PATCH', path, body);
    }

    private async put<T = unknown>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('PUT', path, body);
    }

    private async delete<T = unknown>(
        path: string,
        body?: unknown,
    ): Promise<T> {
        return this.request<T>('DELETE', path, body);
    }

    private static query(params: Record<string, string | number | undefined>) {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                search.set(key, String(value));
            }
        }
        const qs = search.toString();
        return qs ? `?${qs}` : '';
    }

    // Users

    async getUsers(start = 0, size = 25) {
        return this.get(
            `${REST_API.USERS.GET}?start=${start}&size=${size}`,
        );
    }

    async getUserById(userId: number) {
        return this.get(REST_API.USERS.GET_BY_ID(String(userId)));
    }

    async getUserByUsername(username: string) {
        return this.get(REST_API.USERS.GET_BY.USERNAME(username));
    }

    async getUserByShortUuid(shortUuid: string) {
        return this.get(REST_API.USERS.GET_BY.SHORT_UUID(shortUuid));
    }

    /**
     * Looks a user up by Telegram ID.
     *
     * `GET /api/users/by-telegram-id/{id}` was removed in panel 3.x and
     * `POST /api/users/resolve` only accepts id, shortUuid or username. The
     * `stream` route is the one place left that still matches a Telegram ID,
     * and it does so exactly (`WHERE users.telegram_id = $1`) — unlike the
     * `filters` parameter on `GET /api/users`, which matches a substring.
     *
     * Despite the route name this is an ordinary JSON request/response; the
     * "stream" refers to its cursor pagination. The response is a list: a
     * Telegram ID may own several accounts, and the column has no unique
     * constraint.
     */
    async getUsersByTelegramId(telegramId: number, size = 25) {
        return this.get(
            `${REST_API.USERS.STREAM}?telegramId=${telegramId}&size=${size}`,
        );
    }

    async getUserAccessibleNodes(userId: number) {
        return this.get(REST_API.USERS.ACCESSIBLE_NODES(String(userId)));
    }

    async getUserTags() {
        return this.get(REST_API.USERS.TAGS.GET);
    }

    async resolveUsers(params: ResolveUserCommand.RequestBody) {
        return this.post(REST_API.USERS.RESOLVE, params);
    }

    async createUser(params: CreateUserCommand.RequestBody) {
        return this.post(REST_API.USERS.CREATE, params);
    }

    async updateUser(params: UpdateUserCommand.RequestBody) {
        return this.patch(REST_API.USERS.UPDATE, params);
    }

    async deleteUser(userId: number) {
        return this.delete(REST_API.USERS.DELETE(String(userId)));
    }

    async enableUser(userId: number) {
        return this.post(REST_API.USERS.ACTIONS.ENABLE(String(userId)));
    }

    async disableUser(userId: number) {
        return this.post(REST_API.USERS.ACTIONS.DISABLE(String(userId)));
    }

    async revokeUserSubscription(userId: number) {
        return this.post(
            REST_API.USERS.ACTIONS.REVOKE_SUBSCRIPTION(String(userId)),
        );
    }

    async resetUserTraffic(userId: number) {
        return this.post(REST_API.USERS.ACTIONS.RESET_TRAFFIC(String(userId)));
    }

    async extendUser(userId: number, params: ExtendUserCommand.RequestBody) {
        return this.post(
            REST_API.USERS.ACTIONS.EXTEND_EXPIRATION_DATE(String(userId)),
            params,
        );
    }

    async bulkDeleteUsersByStatus(params: BulkDeleteUsersByStatusCommand.RequestBody) {
        return this.post(REST_API.USERS.BULK.DELETE_BY_STATUS, params);
    }

    async bulkUpdateUsers(params: BulkUpdateUsersCommand.RequestBody) {
        return this.post(REST_API.USERS.BULK.UPDATE, params);
    }

    async bulkResetUsersTraffic(params: BulkResetTrafficUsersCommand.RequestBody) {
        return this.post(REST_API.USERS.BULK.RESET_TRAFFIC, params);
    }

    async bulkRevokeUsersSubscription(params: BulkRevokeUsersSubscriptionCommand.RequestBody) {
        return this.post(REST_API.USERS.BULK.REVOKE_SUBSCRIPTION, params);
    }

    async bulkDeleteUsers(params: BulkDeleteUsersCommand.RequestBody) {
        return this.post(REST_API.USERS.BULK.DELETE, params);
    }

    async bulkUpdateUserSquads(params: BulkUpdateUsersSquadsCommand.RequestBody) {
        return this.post(REST_API.USERS.BULK.UPDATE_SQUADS, params);
    }

    async bulkExtendUsersExpiration(params: BulkExtendExpirationDateCommand.RequestBody) {
        return this.post(REST_API.USERS.BULK.EXTEND_EXPIRATION_DATE, params);
    }

    async bulkAllUpdateUsers(params: BulkAllUpdateUsersCommand.RequestBody) {
        return this.post(REST_API.USERS.BULK.ALL.UPDATE, params);
    }

    async bulkAllResetUsersTraffic() {
        return this.post(REST_API.USERS.BULK.ALL.RESET_TRAFFIC);
    }

    async bulkAllExtendUsersExpiration(params: BulkAllExtendExpirationDateCommand.RequestBody) {
        return this.post(REST_API.USERS.BULK.ALL.EXTEND_EXPIRATION_DATE, params);
    }

    // Nodes

    async getNodes() {
        return this.get(REST_API.NODES.GET);
    }

    async getNodeByUuid(uuid: string) {
        return this.get(REST_API.NODES.GET_BY_UUID(uuid));
    }

    async getNodeTags() {
        return this.get(REST_API.NODES.TAGS.GET);
    }

    async createNode(params: CreateNodeCommand.RequestBody) {
        return this.post(REST_API.NODES.CREATE, params);
    }

    async updateNode(params: UpdateNodeCommand.RequestBody) {
        return this.patch(REST_API.NODES.UPDATE, params);
    }

    async deleteNode(uuid: string) {
        return this.delete(REST_API.NODES.DELETE(uuid));
    }

    async enableNode(uuid: string) {
        return this.post(REST_API.NODES.ACTIONS.ENABLE(uuid));
    }

    async disableNode(uuid: string) {
        return this.post(REST_API.NODES.ACTIONS.DISABLE(uuid));
    }

    async restartNode(uuid: string, forceRestart: boolean) {
        return this.post(REST_API.NODES.ACTIONS.RESTART(uuid), { forceRestart });
    }

    async restartAllNodes(forceRestart: boolean) {
        return this.post(REST_API.NODES.ACTIONS.RESTART_ALL, { forceRestart });
    }

    async resetNodeTraffic(uuid: string) {
        return this.post(REST_API.NODES.ACTIONS.RESET_TRAFFIC(uuid));
    }

    async reorderNodes(nodes: ReorderNodesCommand.RequestBody['nodes']) {
        return this.post(REST_API.NODES.ACTIONS.REORDER, { nodes });
    }

    async bulkNodeProfileModification(params: BulkNodesProfileModificationCommand.RequestBody) {
        return this.post(REST_API.NODES.BULK_ACTIONS.PROFILE_MODIFICATION, params);
    }

    async bulkNodeActions(params: BulkNodesActionsCommand.RequestBody) {
        return this.post(REST_API.NODES.BULK_ACTIONS.ACTIONS, params);
    }

    async bulkUpdateNodes(params: BulkNodesUpdateCommand.RequestBody) {
        return this.post(REST_API.NODES.BULK_ACTIONS.UPDATE, params);
    }

    // Hosts

    async getHosts() {
        return this.get(REST_API.HOSTS.GET);
    }

    async getHostByUuid(uuid: string) {
        return this.get(REST_API.HOSTS.GET_BY_UUID(uuid));
    }

    async getHostTags() {
        return this.get(REST_API.HOSTS.TAGS.GET);
    }

    async createHost(params: CreateHostCommand.RequestBody) {
        return this.post(REST_API.HOSTS.CREATE, params);
    }

    async updateHost(params: UpdateHostCommand.RequestBody) {
        return this.patch(REST_API.HOSTS.UPDATE, params);
    }

    async deleteHost(uuid: string) {
        return this.delete(REST_API.HOSTS.DELETE(uuid));
    }

    async bulkEnableHosts(params: BulkEnableHostsCommand.RequestBody) {
        return this.post(REST_API.HOSTS.BULK.ENABLE_HOSTS, params);
    }

    async bulkDisableHosts(params: BulkDisableHostsCommand.RequestBody) {
        return this.post(REST_API.HOSTS.BULK.DISABLE_HOSTS, params);
    }

    async bulkDeleteHosts(params: BulkDeleteHostsCommand.RequestBody) {
        return this.post(REST_API.HOSTS.BULK.DELETE_HOSTS, params);
    }

    async bulkSetHostInbound(params: UpdateManyHostsCommand.RequestBody) {
        return this.patch(REST_API.HOSTS.BULK.UPDATE, params);
    }

    async bulkSetHostPort(params: UpdateManyHostsCommand.RequestBody) {
        return this.patch(REST_API.HOSTS.BULK.UPDATE, params);
    }

    // System

    async getStats() {
        return this.get(REST_API.SYSTEM.STATS.SYSTEM_STATS);
    }

    async getBandwidthStats() {
        return this.get(REST_API.SYSTEM.STATS.BANDWIDTH_STATS);
    }

    async getNodesMetrics() {
        return this.get(REST_API.SYSTEM.STATS.NODES_METRICS);
    }

    async getNodesStatistics() {
        return this.get(REST_API.SYSTEM.STATS.NODES_STATS);
    }

    async getStatsRecap() {
        return this.get(REST_API.SYSTEM.STATS.RECAP);
    }

    async getStatsDigest(query: { start: string; end: string }) {
        return this.get(
            `${REST_API.SYSTEM.STATS.DIGEST}${RemnawaveClient.query(query)}`,
        );
    }

    async getHttpStats() {
        return this.get(REST_API.SYSTEM.STATS.HTTP);
    }

    async getConfiguration() {
        return this.get(REST_API.SYSTEM.CONFIGURATION);
    }

    async getHealth() {
        return this.get(REST_API.SYSTEM.HEALTH);
    }

    async getSystemMetadata() {
        return this.get(REST_API.SYSTEM.METADATA);
    }

    async generateX25519() {
        return this.get(REST_API.SYSTEM.TOOLS.GENERATE_X25519);
    }

    async testSrrMatcher(params: TestSrrMatcherCommand.RequestBody) {
        return this.post(REST_API.SYSTEM.TESTERS.SRR_MATCHER, params);
    }

    // Subscriptions

    async getSubscriptions(start = 0, size = 25) {
        return this.get(
            `${REST_API.SUBSCRIPTIONS.GET}?start=${start}&size=${size}`,
        );
    }

    async getSubscriptionByUserId(userId: number) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_BY.ID(String(userId)));
    }

    async getSubscriptionByUsername(username: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_BY.USERNAME(username));
    }

    async getSubscriptionByShortUuid(shortUuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_BY.SHORT_UUID(shortUuid));
    }

    async getSubscriptionByShortUuidRaw(shortUuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_BY.SHORT_UUID_RAW(shortUuid));
    }

    async getSubscriptionSubpageConfig(shortUuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.SUBPAGE.GET_CONFIG(shortUuid));
    }

    async getConnectionKeysByUserId(userId: number) {
        return this.get(
            REST_API.SUBSCRIPTIONS.GET_CONNECTION_KEYS_BY_USER_ID(String(userId)),
        );
    }

    async getSubscriptionInfo(shortUuid: string) {
        return this.get(REST_API.SUBSCRIPTION.GET_INFO(shortUuid));
    }

    async getSubscriptionRequestHistory() {
        return this.get(REST_API.SUBSCRIPTION_REQUEST_HISTORY.GET);
    }

    async getSubscriptionRequestHistoryStats() {
        return this.get(REST_API.SUBSCRIPTION_REQUEST_HISTORY.STATS);
    }

    // Config Profiles / Inbounds

    async getConfigProfiles() {
        return this.get(REST_API.CONFIG_PROFILES.GET);
    }

    async getConfigProfileByUuid(uuid: string) {
        return this.get(REST_API.CONFIG_PROFILES.GET_BY_UUID(uuid));
    }

    async getAllInbounds() {
        return this.get(REST_API.CONFIG_PROFILES.GET_ALL_INBOUNDS);
    }

    async getInboundsByProfileUuid(uuid: string) {
        return this.get(REST_API.CONFIG_PROFILES.GET_INBOUNDS_BY_PROFILE_UUID(uuid));
    }

    async getComputedConfigByProfileUuid(uuid: string) {
        return this.get(REST_API.CONFIG_PROFILES.GET_COMPUTED_CONFIG_BY_PROFILE_UUID(uuid));
    }

    async createConfigProfile(params: CreateConfigProfileCommand.RequestBody) {
        return this.post(REST_API.CONFIG_PROFILES.CREATE, params);
    }

    async updateConfigProfile(params: UpdateConfigProfileCommand.RequestBody) {
        return this.patch(REST_API.CONFIG_PROFILES.UPDATE, params);
    }

    async deleteConfigProfile(uuid: string) {
        return this.delete(REST_API.CONFIG_PROFILES.DELETE(uuid));
    }

    async reorderConfigProfiles(params: ReorderConfigProfileCommand.RequestBody) {
        return this.post(REST_API.CONFIG_PROFILES.ACTIONS.REORDER, params);
    }

    // Internal Squads

    async getInternalSquads() {
        return this.get(REST_API.INTERNAL_SQUADS.GET);
    }

    async getSquadAccessibleNodes(uuid: string) {
        return this.get(REST_API.INTERNAL_SQUADS.ACCESSIBLE_NODES(uuid));
    }

    async createInternalSquad(params: CreateInternalSquadCommand.RequestBody) {
        return this.post(REST_API.INTERNAL_SQUADS.CREATE, params);
    }

    async updateInternalSquad(params: UpdateInternalSquadCommand.RequestBody) {
        return this.patch(REST_API.INTERNAL_SQUADS.UPDATE, params);
    }

    async deleteInternalSquad(uuid: string) {
        return this.delete(REST_API.INTERNAL_SQUADS.DELETE(uuid));
    }

    async addAllUsersToSquad(squadUuid: string) {
        return this.post(REST_API.INTERNAL_SQUADS.BULK_ACTIONS.ADD_USERS(squadUuid));
    }

    async removeAllUsersFromSquad(squadUuid: string) {
        return this.delete(
            REST_API.INTERNAL_SQUADS.BULK_ACTIONS.REMOVE_USERS(squadUuid),
        );
    }

    async addManyUsersToSquad(
        squadUuid: string,
        params: AddManyUsersToInternalSquadCommand.RequestBody,
    ) {
        return this.post(
            REST_API.INTERNAL_SQUADS.BULK_ACTIONS.ADD_MANY_USERS(squadUuid),
            params,
        );
    }

    async removeManyUsersFromSquad(
        squadUuid: string,
        params: DeleteManyUsersFromInternalSquadCommand.RequestBody,
    ) {
        return this.delete(
            REST_API.INTERNAL_SQUADS.BULK_ACTIONS.REMOVE_MANY_USERS(squadUuid),
            params,
        );
    }

    // HWID

    async getUserHwidDevices(userId: number) {
        return this.get(REST_API.HWID.GET_USER_HWID_DEVICES(String(userId)));
    }

    /**
     * Return one current HWID snapshot for every panel account owned by a
     * Telegram identity. Support callers must not make the model stitch
     * together userId/hwid pairs from separate calls: one Telegram ID can own
     * more than one Remnawave account, and device names are not unique.
     */
    async getSupportHwidDevicesByTelegramId(telegramId: number) {
        const usersResult = await this.getUsersByTelegramId(telegramId, 100);
        const users = RemnawaveClient.extractUsers(usersResult);
        const accounts = await Promise.all(
            users.map(async (user) => {
                const devicesResult = await this.getUserHwidDevices(user.id);
                const devices = RemnawaveClient.extractHwidDevices(devicesResult);
                return {
                    userId: user.id,
                    username: user.username,
                    devices,
                };
            }),
        );

        return {
            response: {
                total: accounts.reduce((sum, account) => sum + account.devices.length, 0),
                accounts,
            },
        };
    }

    async getAllHwidDevices() {
        return this.get(REST_API.HWID.GET_ALL_HWID_DEVICES);
    }

    async getHwidStats() {
        return this.get(REST_API.HWID.STATS);
    }

    async getHwidTopUsers() {
        return this.get(REST_API.HWID.TOP_USERS_BY_DEVICES);
    }

    async createUserHwidDevice(params: CreateUserHwidDeviceCommand.RequestBody) {
        return this.post(REST_API.HWID.CREATE_USER_HWID_DEVICE, params);
    }

    async deleteHwidDevice(params: DeleteUserHwidDeviceCommand.RequestBody) {
        return this.post(REST_API.HWID.DELETE_USER_HWID_DEVICE, params);
    }

    /**
     * Delete a support user's device only after resolving and validating the
     * owning account in the current panel state. A concurrent delete is
     * reported as already_absent instead of becoming an MCP tool error.
     */
    async deleteSupportHwidDeviceByTelegramId(
        telegramId: number,
        userId: number,
        hwid: string,
    ) {
        const usersResult = await this.getUsersByTelegramId(telegramId, 100);
        const users = RemnawaveClient.extractUsers(usersResult);
        if (!users.some((user) => user.id === userId)) {
            return {
                status: 'already_absent',
                userId,
                hwid,
                reason: 'account_not_owned_by_telegram_id',
            };
        }

        const devicesResult = await this.getUserHwidDevices(userId);
        const devices = RemnawaveClient.extractHwidDevices(devicesResult);
        if (!devices.some((device) => device.hwid === hwid)) {
            return { status: 'already_absent', userId, hwid };
        }

        try {
            const result = await this.deleteHwidDevice({ userId, hwid });
            return { status: 'deleted', userId, hwid, result };
        } catch (error) {
            if (!RemnawaveClient.isHwidDeviceNotFound(error)) {
                throw error;
            }

            // The device may have disappeared after the fresh read. Confirm
            // that state before treating the panel's 404 as an idempotent
            // success; unrelated API failures must still surface normally.
            const freshResult = await this.getUserHwidDevices(userId);
            const freshDevices = RemnawaveClient.extractHwidDevices(freshResult);
            if (!freshDevices.some((device) => device.hwid === hwid)) {
                return { status: 'already_absent', userId, hwid };
            }
            throw error;
        }
    }

    async deleteAllUserHwidDevices(params: DeleteAllUserHwidDevicesCommand.RequestBody) {
        return this.post(REST_API.HWID.DELETE_ALL_USER_HWID_DEVICES, params);
    }

    private static extractUsers(value: unknown): Array<{ id: number; username?: string }> {
        const response = RemnawaveClient.responseRecord(value);
        const users = response.users;
        if (!Array.isArray(users)) {
            throw new Error('Remnawave API returned an invalid users response');
        }
        return users.flatMap((user) => {
            if (!user || typeof user !== 'object') {
                return [];
            }
            const record = user as Record<string, unknown>;
            return typeof record.id === 'number'
                ? [{
                      id: record.id,
                      ...(typeof record.username === 'string'
                          ? { username: record.username }
                          : {}),
                  }]
                : [];
        });
    }

    private static extractHwidDevices(value: unknown): Array<Record<string, unknown> & { hwid: string }> {
        const response = RemnawaveClient.responseRecord(value);
        const devices = response.devices;
        if (!Array.isArray(devices)) {
            throw new Error('Remnawave API returned an invalid HWID response');
        }
        return devices.flatMap((device) => {
            if (!device || typeof device !== 'object') {
                return [];
            }
            const record = device as Record<string, unknown>;
            return typeof record.hwid === 'string'
                ? [record as Record<string, unknown> & { hwid: string }]
                : [];
        });
    }

    private static responseRecord(value: unknown): Record<string, unknown> {
        if (!value || typeof value !== 'object') {
            throw new Error('Remnawave API returned an invalid response');
        }
        const response = (value as Record<string, unknown>).response;
        if (!response || typeof response !== 'object') {
            throw new Error('Remnawave API returned an invalid response');
        }
        return response as Record<string, unknown>;
    }

    private static isHwidDeviceNotFound(error: unknown): boolean {
        return error instanceof Error && /hwid\s+device\s+not\s+found/i.test(error.message);
    }

    // Bandwidth Stats

    async getNodesBandwidth(query: { start: string; end: string }) {
        return this.get(
            `${REST_API.BANDWIDTH_STATS.NODES.GET}${RemnawaveClient.query(query)}`,
        );
    }

    async getNodesRealtimeBandwidth() {
        return this.get(REST_API.BANDWIDTH_STATS.NODES.GET_REALTIME);
    }

    async getUserBandwidthByUserId(
        userId: number,
        query: { start: string; end: string },
    ) {
        return this.get(
            `${REST_API.BANDWIDTH_STATS.USERS.GET_BY_ID(String(userId))}${RemnawaveClient.query(query)}`,
        );
    }

    async getNodesUsage(
        params: GetNodeUsageCommand.RequestBody,
        query: { start: string; end: string; minTotalBytes?: number },
    ) {
        return this.post(
            `${REST_API.BANDWIDTH_STATS.NODES.GET_USAGE}${RemnawaveClient.query(query)}`,
            params,
        );
    }

    async getInternalSquadUsage(
        squadUuid: string,
        query: {
            start: string;
            end: string;
            minTotalBytes?: number;
            limit?: number;
            cursor?: number;
        },
    ) {
        return this.get(
            `${REST_API.BANDWIDTH_STATS.INTERNAL_SQUADS.GET_USAGE(squadUuid)}${RemnawaveClient.query(query)}`,
        );
    }

    async getInternalSquadUserUsage(
        squadUuid: string,
        userId: number,
        query: { start: string; end: string },
    ) {
        return this.get(
            `${REST_API.BANDWIDTH_STATS.INTERNAL_SQUADS.USER_USAGE(squadUuid, String(userId))}${RemnawaveClient.query(query)}`,
        );
    }

    // Auth

    async getAuthStatus() {
        return this.get(REST_API.AUTH.GET_STATUS);
    }

    // API Tokens

    async getApiTokens() {
        return this.get(REST_API.API_TOKENS.GET);
    }

    async createApiToken(params: CreateApiTokenCommand.RequestBody) {
        return this.post(REST_API.API_TOKENS.CREATE, params);
    }

    async deleteApiToken(uuid: string) {
        return this.delete(REST_API.API_TOKENS.DELETE(uuid));
    }

    async getOtt() {
        return this.post(REST_API.API_TOKENS.OTT);
    }

    // Keygen

    async getKeygen() {
        return this.get(REST_API.KEYGEN.GET);
    }

    // Infra Billing

    async getBillingProviders() {
        return this.get(REST_API.INFRA_BILLING.GET_PROVIDERS);
    }

    async getBillingProviderByUuid(uuid: string) {
        return this.get(REST_API.INFRA_BILLING.GET_PROVIDER_BY_UUID(uuid));
    }

    async createBillingProvider(params: CreateInfraProviderCommand.RequestBody) {
        return this.post(REST_API.INFRA_BILLING.CREATE_PROVIDER, params);
    }

    async updateBillingProvider(params: UpdateInfraProviderCommand.RequestBody) {
        return this.patch(REST_API.INFRA_BILLING.UPDATE_PROVIDER, params);
    }

    async deleteBillingProvider(uuid: string) {
        return this.delete(REST_API.INFRA_BILLING.DELETE_PROVIDER(uuid));
    }

    async getBillingNodes() {
        return this.get(REST_API.INFRA_BILLING.GET_BILLING_NODES);
    }

    async createBillingNode(params: CreateInfraBillingNodeCommand.RequestBody) {
        return this.post(REST_API.INFRA_BILLING.CREATE_BILLING_NODE, params);
    }

    async updateBillingNode(params: UpdateInfraBillingNodeCommand.RequestBody) {
        return this.patch(REST_API.INFRA_BILLING.UPDATE_BILLING_NODE, params);
    }

    async deleteBillingNode(uuid: string) {
        return this.delete(REST_API.INFRA_BILLING.DELETE_BILLING_NODE(uuid));
    }

    async getBillingHistory() {
        return this.get(REST_API.INFRA_BILLING.GET_BILLING_HISTORY);
    }

    async createBillingHistory(params: CreateInfraBillingRecordCommand.RequestBody) {
        return this.post(REST_API.INFRA_BILLING.CREATE_BILLING_HISTORY, params);
    }

    async deleteBillingHistory(uuid: string) {
        return this.delete(REST_API.INFRA_BILLING.DELETE_BILLING_HISTORY(uuid));
    }

    // Snippets

    async getSnippets() {
        return this.get(REST_API.SNIPPETS.GET);
    }

    async createSnippet(params: CreateSnippetCommand.RequestBody) {
        return this.post(REST_API.SNIPPETS.CREATE, params);
    }

    async updateSnippet(params: UpdateSnippetCommand.RequestBody) {
        return this.patch(REST_API.SNIPPETS.UPDATE, params);
    }

    async deleteSnippet(params: DeleteSnippetCommand.RequestBody) {
        return this.delete(REST_API.SNIPPETS.DELETE, params);
    }

    async syncSnippet(params: SyncSnippetCommand.RequestBody) {
        return this.post(REST_API.SNIPPETS.ACTIONS.SYNC, params);
    }

    // External Squads

    async getExternalSquads() {
        return this.get(REST_API.EXTERNAL_SQUADS.GET);
    }

    async getExternalSquadByUuid(uuid: string) {
        return this.get(REST_API.EXTERNAL_SQUADS.GET_BY_UUID(uuid));
    }

    async createExternalSquad(params: CreateExternalSquadCommand.RequestBody) {
        return this.post(REST_API.EXTERNAL_SQUADS.CREATE, params);
    }

    async updateExternalSquad(params: UpdateExternalSquadCommand.RequestBody) {
        return this.patch(REST_API.EXTERNAL_SQUADS.UPDATE, params);
    }

    async deleteExternalSquad(uuid: string) {
        return this.delete(REST_API.EXTERNAL_SQUADS.DELETE(uuid));
    }

    async addAllUsersToExternalSquad(squadUuid: string) {
        return this.post(
            REST_API.EXTERNAL_SQUADS.BULK_ACTIONS.ADD_USERS(squadUuid),
        );
    }

    async removeAllUsersFromExternalSquad(squadUuid: string) {
        return this.delete(
            REST_API.EXTERNAL_SQUADS.BULK_ACTIONS.REMOVE_USERS(squadUuid),
        );
    }

    async reorderExternalSquads(params: ReorderExternalSquadCommand.RequestBody) {
        return this.post(REST_API.EXTERNAL_SQUADS.ACTIONS.REORDER, params);
    }

    // Settings

    async getSettings() {
        return this.get(REST_API.REMNAAWAVE_SETTINGS.GET);
    }

    async updateSettings(params: UpdateRemnawaveSettingsCommand.RequestBody) {
        return this.patch(REST_API.REMNAAWAVE_SETTINGS.UPDATE, params);
    }

    // Subscription Page Configs

    async getSubscriptionPageConfigs() {
        return this.get(REST_API.SUBSCRIPTION_PAGE_CONFIGS.GET_ALL);
    }

    async getSubscriptionPageConfig(uuid: string) {
        return this.get(REST_API.SUBSCRIPTION_PAGE_CONFIGS.GET(uuid));
    }

    async createSubscriptionPageConfig(params: CreateSubpageConfigCommand.RequestBody) {
        return this.post(REST_API.SUBSCRIPTION_PAGE_CONFIGS.CREATE, params);
    }

    async updateSubscriptionPageConfig(params: UpdateSubpageConfigCommand.RequestBody) {
        return this.patch(REST_API.SUBSCRIPTION_PAGE_CONFIGS.UPDATE, params);
    }

    async deleteSubscriptionPageConfig(uuid: string) {
        return this.delete(REST_API.SUBSCRIPTION_PAGE_CONFIGS.DELETE(uuid));
    }

    async reorderSubscriptionPageConfigs(params: ReorderSubpageConfigsCommand.RequestBody) {
        return this.post(REST_API.SUBSCRIPTION_PAGE_CONFIGS.ACTIONS.REORDER, params);
    }

    async cloneSubscriptionPageConfig(params: CloneSubpageConfigCommand.RequestBody) {
        return this.post(REST_API.SUBSCRIPTION_PAGE_CONFIGS.ACTIONS.CLONE, params);
    }

    // Node Plugins

    async getNodePlugins() {
        return this.get(REST_API.NODE_PLUGINS.GET_ALL);
    }

    async getNodePlugin(uuid: string) {
        return this.get(REST_API.NODE_PLUGINS.GET(uuid));
    }

    async createNodePlugin(params: CreateNodePluginCommand.RequestBody) {
        return this.post(REST_API.NODE_PLUGINS.CREATE, params);
    }

    async updateNodePlugin(params: UpdateNodePluginCommand.RequestBody) {
        return this.patch(REST_API.NODE_PLUGINS.UPDATE, params);
    }

    async deleteNodePlugin(uuid: string) {
        return this.delete(REST_API.NODE_PLUGINS.DELETE(uuid));
    }

    async reorderNodePlugins(params: ReorderNodePluginCommand.RequestBody) {
        return this.post(REST_API.NODE_PLUGINS.ACTIONS.REORDER, params);
    }

    async cloneNodePlugin(params: CloneNodePluginCommand.RequestBody) {
        return this.post(REST_API.NODE_PLUGINS.ACTIONS.CLONE, params);
    }

    async syncNodePlugin(params: SyncNodePluginCommand.RequestBody) {
        return this.post(REST_API.NODE_PLUGINS.ACTIONS.SYNC, params);
    }

    async executeNodePlugin(params: PluginExecutorCommand.RequestBody) {
        return this.post(REST_API.NODE_PLUGINS.EXECUTOR, params);
    }

    async getTorrentBlockerReports() {
        return this.get(REST_API.NODE_PLUGINS.TORRENT_BLOCKER.GET_REPORTS);
    }

    async getTorrentBlockerStats() {
        return this.get(REST_API.NODE_PLUGINS.TORRENT_BLOCKER.GET_REPORTS_STATS);
    }

    async truncateTorrentBlockerReports() {
        return this.delete(REST_API.NODE_PLUGINS.TORRENT_BLOCKER.TRUNCATE_REPORTS);
    }

    // Node Plugins / Shared Lists

    async getSharedLists() {
        return this.get(REST_API.NODE_PLUGINS.SHARED_LISTS.GET_ALL);
    }

    async getSharedList(uuid: string) {
        return this.get(REST_API.NODE_PLUGINS.SHARED_LISTS.GET(uuid));
    }

    async createSharedList(params: CreateSharedListCommand.RequestBody) {
        return this.post(REST_API.NODE_PLUGINS.SHARED_LISTS.CREATE, params);
    }

    async updateSharedList(params: UpdateSharedListCommand.RequestBody) {
        return this.patch(REST_API.NODE_PLUGINS.SHARED_LISTS.UPDATE, params);
    }

    async deleteSharedList(uuid: string) {
        return this.delete(REST_API.NODE_PLUGINS.SHARED_LISTS.DELETE(uuid));
    }

    async syncSharedList(params: SyncSharedListCommand.RequestBody) {
        return this.post(REST_API.NODE_PLUGINS.SHARED_LISTS.ACTIONS.SYNC, params);
    }

    // Node Integrations

    async getNodeIntegrations() {
        return this.get(REST_API.NODE_INTEGRATIONS.GET_ALL);
    }

    async getNodeIntegration(uuid: string) {
        return this.get(REST_API.NODE_INTEGRATIONS.GET(uuid));
    }

    async createNodeIntegration(params: CreateNodeIntegrationCommand.RequestBody) {
        return this.post(REST_API.NODE_INTEGRATIONS.CREATE, params);
    }

    async updateNodeIntegration(params: UpdateNodeIntegrationCommand.RequestBody) {
        return this.patch(REST_API.NODE_INTEGRATIONS.UPDATE, params);
    }

    async deleteNodeIntegration(uuid: string) {
        return this.delete(REST_API.NODE_INTEGRATIONS.DELETE(uuid));
    }

    // Connections (replaces IP Control)

    async connectionsByUser(userId: number) {
        return this.post(
            REST_API.CONNECTIONS.CONNECTIONS_BY_USER(String(userId)),
        );
    }

    async connectionsByUserResult(jobId: string) {
        return this.get(REST_API.CONNECTIONS.CONNECTIONS_BY_USER_RESULT(jobId));
    }

    async connectionsByNode(nodeUuid: string) {
        return this.post(REST_API.CONNECTIONS.CONNECTIONS_BY_NODE(nodeUuid));
    }

    async connectionsByNodeResult(jobId: string) {
        return this.get(REST_API.CONNECTIONS.CONNECTIONS_BY_NODE_RESULT(jobId));
    }

    async dropConnections(params: DropConnectionsCommand.RequestBody) {
        return this.post(REST_API.CONNECTIONS.DROP_CONNECTIONS, params);
    }

    async geocheckByNode(nodeUuid: string) {
        return this.post(REST_API.CONNECTIONS.GEOCHECK_BY_NODE(nodeUuid));
    }

    async geocheckByNodeResult(jobId: string) {
        return this.get(REST_API.CONNECTIONS.GEOCHECK_BY_NODE_RESULT(jobId));
    }

    // Metadata

    async getNodeMetadata(uuid: string) {
        return this.get(REST_API.METADATA.NODE.GET(uuid));
    }

    async upsertNodeMetadata(uuid: string, params: Record<string, unknown>) {
        return this.put(REST_API.METADATA.NODE.UPSERT(uuid), { metadata: params });
    }

    async getUserMetadata(userId: number) {
        return this.get(REST_API.METADATA.USER.GET(String(userId)));
    }

    async upsertUserMetadata(userId: number, params: Record<string, unknown>) {
        return this.put(REST_API.METADATA.USER.UPSERT(String(userId)), {
            metadata: params,
        });
    }
}
