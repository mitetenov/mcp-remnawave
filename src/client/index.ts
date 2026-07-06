import { REST_API } from '@remnawave/backend-contract';
import type {
    CreateUserCommand,
    UpdateUserCommand,
    DeleteUserCommand,
    ResolveUserCommand,
    EnableUserCommand,
    DisableUserCommand,
    ResetUserTrafficCommand,
    RevokeUserSubscriptionCommand,
    BulkDeleteUsersByStatusCommand,
    BulkUpdateUsersCommand,
    BulkResetTrafficUsersCommand,
    BulkRevokeUsersSubscriptionCommand,
    BulkDeleteUsersCommand,
    BulkUpdateUsersSquadsCommand,
    BulkExtendExpirationDateCommand,
    BulkAllUpdateUsersCommand,
    BulkAllResetTrafficUsersCommand,
    BulkAllExtendExpirationDateCommand,
    CreateNodeCommand,
    UpdateNodeCommand,
    DeleteNodeCommand,
    EnableNodeCommand,
    DisableNodeCommand,
    RestartNodeCommand,
    RestartAllNodesCommand,
    ResetNodeTrafficCommand,
    ReorderNodeCommand,
    BulkNodesProfileModificationCommand,
    BulkNodesActionsCommand,
    BulkNodesUpdateCommand,
    CreateHostCommand,
    UpdateHostCommand,
    DeleteHostCommand,
    BulkEnableHostsCommand,
    BulkDisableHostsCommand,
    BulkDeleteHostsCommand,
    UpdateManyHostsCommand,
    CreateConfigProfileCommand,
    UpdateConfigProfileCommand,
    DeleteConfigProfileCommand,
    ReorderConfigProfileCommand,
    CreateInternalSquadCommand,
    UpdateInternalSquadCommand,
    DeleteInternalSquadCommand,
    CreateUserHwidDeviceCommand,
    DeleteUserHwidDeviceCommand,
    DeleteAllUserHwidDevicesCommand,
    CreateInfraBillingHistoryRecordCommand,
    CreateInfraBillingNodeCommand,
    CreateInfraProviderCommand,
    UpdateInfraBillingNodeCommand,
    UpdateInfraProviderCommand,
    DeleteInfraBillingNodeByUuidCommand,
    DeleteInfraBillingHistoryRecordCommand,
    DeleteInfraProviderByUuidCommand,
    CreateSnippetCommand,
    UpdateSnippetCommand,
    DeleteSnippetCommand,
    CreateExternalSquadCommand,
    UpdateExternalSquadCommand,
    DeleteExternalSquadCommand,
    ReorderExternalSquadCommand,
    UpdateRemnawaveSettingsCommand,
    CreateSubscriptionPageConfigCommand,
    UpdateSubscriptionPageConfigCommand,
    DeleteSubscriptionPageConfigCommand,
    CloneSubscriptionPageConfigCommand,
    ReorderSubscriptionPageConfigsCommand,
    CreateNodePluginCommand,
    UpdateNodePluginCommand,
    DeleteNodePluginCommand,
    ReorderNodePluginCommand,
    CloneNodePluginCommand,
    PluginExecutorCommand,
    CreateApiTokenCommand,
    DeleteApiTokenCommand,
    DropConnectionsCommand,
    TestSrrMatcherCommand,
} from '@remnawave/backend-contract';
import { Config, isConfigured } from '../config.js';

export class RemnawaveClient {
    private baseUrl: string;
    private headers: Record<string, string>;
    private configured: boolean;

    constructor(config: Config) {
        this.baseUrl = config.baseUrl;
        this.configured = isConfigured(config);
        this.headers = {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
        };
        if (config.apiKey) {
            this.headers['X-Api-Key'] = config.apiKey;
        }
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
        };
        if (body !== undefined) {
            options.body = JSON.stringify(body);
        }
        const res = await fetch(url, options);
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
        return res.json() as Promise<T>;
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

    private async delete<T = unknown>(path: string): Promise<T> {
        return this.request<T>('DELETE', path);
    }

    // Users

    async getUsers(start = 0, size = 25) {
        return this.get(
            `${REST_API.USERS.GET}?start=${start}&size=${size}`,
        );
    }

    async getUserByUuid(uuid: string) {
        return this.get(REST_API.USERS.GET_BY_UUID(uuid));
    }

    async getUserByUsername(username: string) {
        return this.get(REST_API.USERS.GET_BY.USERNAME(username));
    }

    async getUserByShortUuid(shortUuid: string) {
        return this.get(REST_API.USERS.GET_BY.SHORT_UUID(shortUuid));
    }

    async getUserByTelegramId(telegramId: string) {
        return this.get(REST_API.USERS.GET_BY.TELEGRAM_ID(telegramId));
    }

    async getUserByEmail(email: string) {
        return this.get(REST_API.USERS.GET_BY.EMAIL(email));
    }

    async getUserByTag(tag: string) {
        return this.get(REST_API.USERS.GET_BY.TAG(tag));
    }

    async getUserById(id: string) {
        return this.get(REST_API.USERS.GET_BY.ID(id));
    }

    async getUserBySubscriptionUuid(subscriptionUuid: string) {
        return this.get(REST_API.USERS.GET_BY.SUBSCRIPTION_UUID(subscriptionUuid));
    }

    async getUserTags() {
        return this.get(REST_API.USERS.TAGS.GET);
    }

    async resolveUsers(params: ResolveUserCommand.Request) {
        return this.post<ResolveUserCommand.Response>(REST_API.USERS.RESOLVE, params);
    }

    async createUser(params: CreateUserCommand.Request) {
        return this.post<CreateUserCommand.Response>(REST_API.USERS.CREATE, params);
    }

    async updateUser(params: UpdateUserCommand.Request) {
        return this.patch<UpdateUserCommand.Response>(REST_API.USERS.UPDATE, params);
    }

    async deleteUser(uuid: string) {
        return this.delete<DeleteUserCommand.Response>(REST_API.USERS.DELETE(uuid));
    }

    async enableUser(uuid: string) {
        return this.post<EnableUserCommand.Response>(REST_API.USERS.ACTIONS.ENABLE(uuid));
    }

    async disableUser(uuid: string) {
        return this.post<DisableUserCommand.Response>(REST_API.USERS.ACTIONS.DISABLE(uuid));
    }

    async revokeUserSubscription(uuid: string) {
        return this.post<RevokeUserSubscriptionCommand.Response>(REST_API.USERS.ACTIONS.REVOKE_SUBSCRIPTION(uuid));
    }

    async resetUserTraffic(uuid: string) {
        return this.post<ResetUserTrafficCommand.Response>(REST_API.USERS.ACTIONS.RESET_TRAFFIC(uuid));
    }

    async bulkDeleteUsersByStatus(params: BulkDeleteUsersByStatusCommand.Request) {
        return this.post<BulkDeleteUsersByStatusCommand.Response>(REST_API.USERS.BULK.DELETE_BY_STATUS, params);
    }

    async bulkUpdateUsers(params: BulkUpdateUsersCommand.Request) {
        return this.post<BulkUpdateUsersCommand.Response>(REST_API.USERS.BULK.UPDATE, params);
    }

    async bulkResetUsersTraffic(params: BulkResetTrafficUsersCommand.Request) {
        return this.post<BulkResetTrafficUsersCommand.Response>(REST_API.USERS.BULK.RESET_TRAFFIC, params);
    }

    async bulkRevokeUsersSubscription(params: BulkRevokeUsersSubscriptionCommand.Request) {
        return this.post<BulkRevokeUsersSubscriptionCommand.Response>(REST_API.USERS.BULK.REVOKE_SUBSCRIPTION, params);
    }

    async bulkDeleteUsers(params: BulkDeleteUsersCommand.Request) {
        return this.post<BulkDeleteUsersCommand.Response>(REST_API.USERS.BULK.DELETE, params);
    }

    async bulkUpdateUserSquads(params: BulkUpdateUsersSquadsCommand.Request) {
        return this.post<BulkUpdateUsersSquadsCommand.Response>(REST_API.USERS.BULK.UPDATE_SQUADS, params);
    }

    async bulkExtendUsersExpiration(params: BulkExtendExpirationDateCommand.Request) {
        return this.post<BulkExtendExpirationDateCommand.Response>(REST_API.USERS.BULK.EXTEND_EXPIRATION_DATE, params);
    }

    async bulkAllUpdateUsers(params: BulkAllUpdateUsersCommand.Request) {
        return this.post<BulkAllUpdateUsersCommand.Response>(REST_API.USERS.BULK.ALL.UPDATE, params);
    }

    async bulkAllResetUsersTraffic() {
        return this.post<BulkAllResetTrafficUsersCommand.Response>(REST_API.USERS.BULK.ALL.RESET_TRAFFIC);
    }

    async bulkAllExtendUsersExpiration(params: BulkAllExtendExpirationDateCommand.Request) {
        return this.post<BulkAllExtendExpirationDateCommand.Response>(REST_API.USERS.BULK.ALL.EXTEND_EXPIRATION_DATE, params);
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

    async createNode(params: CreateNodeCommand.Request) {
        return this.post<CreateNodeCommand.Response>(REST_API.NODES.CREATE, params);
    }

    async updateNode(params: UpdateNodeCommand.Request) {
        return this.patch<UpdateNodeCommand.Response>(REST_API.NODES.UPDATE, params);
    }

    async deleteNode(uuid: string) {
        return this.delete<DeleteNodeCommand.Response>(REST_API.NODES.DELETE(uuid));
    }

    async enableNode(uuid: string) {
        return this.post<EnableNodeCommand.Response>(REST_API.NODES.ACTIONS.ENABLE(uuid));
    }

    async disableNode(uuid: string) {
        return this.post<DisableNodeCommand.Response>(REST_API.NODES.ACTIONS.DISABLE(uuid));
    }

    async restartNode(uuid: string, forceRestart?: boolean) {
        return this.post<RestartNodeCommand.Response>(
            REST_API.NODES.ACTIONS.RESTART(uuid),
            forceRestart !== undefined ? { forceRestart } : undefined,
        );
    }

    async restartAllNodes(forceRestart?: boolean) {
        return this.post<RestartAllNodesCommand.Response>(
            REST_API.NODES.ACTIONS.RESTART_ALL,
            forceRestart !== undefined ? { forceRestart } : undefined,
        );
    }

    async resetNodeTraffic(uuid: string) {
        return this.post<ResetNodeTrafficCommand.Response>(REST_API.NODES.ACTIONS.RESET_TRAFFIC(uuid));
    }

    async reorderNodes(nodes: ReorderNodeCommand.Request['nodes']) {
        return this.post<ReorderNodeCommand.Response>(REST_API.NODES.ACTIONS.REORDER, { nodes });
    }

    async bulkNodeProfileModification(params: BulkNodesProfileModificationCommand.Request) {
        return this.post<BulkNodesProfileModificationCommand.Response>(REST_API.NODES.BULK_ACTIONS.PROFILE_MODIFICATION, params);
    }

    async bulkNodeActions(params: BulkNodesActionsCommand.Request) {
        return this.post<BulkNodesActionsCommand.Response>(REST_API.NODES.BULK_ACTIONS.ACTIONS, params);
    }

    async bulkUpdateNodes(params: BulkNodesUpdateCommand.Request) {
        return this.post<BulkNodesUpdateCommand.Response>(REST_API.NODES.BULK_ACTIONS.UPDATE, params);
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

    async createHost(params: CreateHostCommand.Request) {
        return this.post<CreateHostCommand.Response>(REST_API.HOSTS.CREATE, params);
    }

    async updateHost(params: UpdateHostCommand.Request) {
        return this.patch<UpdateHostCommand.Response>(REST_API.HOSTS.UPDATE, params);
    }

    async deleteHost(uuid: string) {
        return this.delete<DeleteHostCommand.Response>(REST_API.HOSTS.DELETE(uuid));
    }

    async bulkEnableHosts(params: BulkEnableHostsCommand.Request) {
        return this.post<BulkEnableHostsCommand.Response>(REST_API.HOSTS.BULK.ENABLE_HOSTS, params);
    }

    async bulkDisableHosts(params: BulkDisableHostsCommand.Request) {
        return this.post<BulkDisableHostsCommand.Response>(REST_API.HOSTS.BULK.DISABLE_HOSTS, params);
    }

    async bulkDeleteHosts(params: BulkDeleteHostsCommand.Request) {
        return this.post<BulkDeleteHostsCommand.Response>(REST_API.HOSTS.BULK.DELETE_HOSTS, params);
    }

    async bulkSetHostInbound(params: UpdateManyHostsCommand.Request) {
        return this.post<UpdateManyHostsCommand.Response>(REST_API.HOSTS.BULK.UPDATE, params);
    }

    async bulkSetHostPort(params: UpdateManyHostsCommand.Request) {
        return this.post<UpdateManyHostsCommand.Response>(REST_API.HOSTS.BULK.UPDATE, params);
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

    async getHealth() {
        return this.get(REST_API.SYSTEM.HEALTH);
    }

    async getSystemMetadata() {
        return this.get(REST_API.SYSTEM.METADATA);
    }

    async generateX25519() {
        return this.get(REST_API.SYSTEM.TOOLS.GENERATE_X25519);
    }

    async testSrrMatcher(params: TestSrrMatcherCommand.Request) {
        return this.post<TestSrrMatcherCommand.Response>(REST_API.SYSTEM.TESTERS.SRR_MATCHER, params);
    }

    // Subscriptions

    async getSubscriptions(start = 0, size = 25) {
        return this.get(
            `${REST_API.SUBSCRIPTIONS.GET}?start=${start}&size=${size}`,
        );
    }

    async getSubscriptionByUuid(uuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_BY.UUID(uuid));
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

    async getConnectionKeysByUuid(uuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_CONNECTION_KEYS_BY_UUID(uuid));
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

    async createConfigProfile(params: CreateConfigProfileCommand.Request) {
        return this.post<CreateConfigProfileCommand.Response>(REST_API.CONFIG_PROFILES.CREATE, params);
    }

    async updateConfigProfile(params: UpdateConfigProfileCommand.Request) {
        return this.patch<UpdateConfigProfileCommand.Response>(REST_API.CONFIG_PROFILES.UPDATE, params);
    }

    async deleteConfigProfile(uuid: string) {
        return this.delete<DeleteConfigProfileCommand.Response>(REST_API.CONFIG_PROFILES.DELETE(uuid));
    }

    async reorderConfigProfiles(params: ReorderConfigProfileCommand.Request) {
        return this.post<ReorderConfigProfileCommand.Response>(REST_API.CONFIG_PROFILES.ACTIONS.REORDER, params);
    }

    // Internal Squads

    async getInternalSquads() {
        return this.get(REST_API.INTERNAL_SQUADS.GET);
    }

    async getSquadAccessibleNodes(uuid: string) {
        return this.get(REST_API.INTERNAL_SQUADS.ACCESSIBLE_NODES(uuid));
    }

    async createInternalSquad(params: CreateInternalSquadCommand.Request) {
        return this.post<CreateInternalSquadCommand.Response>(REST_API.INTERNAL_SQUADS.CREATE, params);
    }

    async updateInternalSquad(params: UpdateInternalSquadCommand.Request) {
        return this.patch<UpdateInternalSquadCommand.Response>(REST_API.INTERNAL_SQUADS.UPDATE, params);
    }

    async deleteInternalSquad(uuid: string) {
        return this.delete<DeleteInternalSquadCommand.Response>(REST_API.INTERNAL_SQUADS.DELETE(uuid));
    }

    async addUsersToSquad(squadUuid: string, userUuids: string[]) {
        return this.post(
            REST_API.INTERNAL_SQUADS.BULK_ACTIONS.ADD_USERS(squadUuid),
            { userUuids },
        );
    }

    async removeUsersFromSquad(squadUuid: string, userUuids: string[]) {
        return this.post(
            REST_API.INTERNAL_SQUADS.BULK_ACTIONS.REMOVE_USERS(squadUuid),
            { userUuids },
        );
    }

    // HWID

    async getUserHwidDevices(userUuid: string) {
        return this.get(REST_API.HWID.GET_USER_HWID_DEVICES(userUuid));
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

    async createUserHwidDevice(params: CreateUserHwidDeviceCommand.Request) {
        return this.post<CreateUserHwidDeviceCommand.Response>(REST_API.HWID.CREATE_USER_HWID_DEVICE, params);
    }

    async deleteHwidDevice(userUuid: string, hwid: string) {
        return this.post<DeleteUserHwidDeviceCommand.Response>(REST_API.HWID.DELETE_USER_HWID_DEVICE, {
            userUuid,
            hwid,
        } as DeleteUserHwidDeviceCommand.Request);
    }

    async deleteAllUserHwidDevices(userUuid: string) {
        return this.post<DeleteAllUserHwidDevicesCommand.Response>(REST_API.HWID.DELETE_ALL_USER_HWID_DEVICES, {
            userUuid,
        } as DeleteAllUserHwidDevicesCommand.Request);
    }

    // Bandwidth Stats

    async getNodesBandwidth() {
        return this.get(REST_API.BANDWIDTH_STATS.NODES.GET);
    }

    async getNodesRealtimeBandwidth() {
        return this.get(REST_API.BANDWIDTH_STATS.NODES.GET_REALTIME);
    }

    async getUserBandwidthByUuid(uuid: string) {
        return this.get(REST_API.BANDWIDTH_STATS.USERS.GET_BY_UUID(uuid));
    }

    // Auth

    async getAuthStatus() {
        return this.get(REST_API.AUTH.GET_STATUS);
    }

    // API Tokens

    async getApiTokens() {
        return this.get(REST_API.API_TOKENS.GET);
    }

    async createApiToken(params: CreateApiTokenCommand.Request) {
        return this.post<CreateApiTokenCommand.Response>(REST_API.API_TOKENS.CREATE, params);
    }

    async deleteApiToken(uuid: string) {
        return this.delete<DeleteApiTokenCommand.Response>(REST_API.API_TOKENS.DELETE(uuid));
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

    async createBillingProvider(params: CreateInfraProviderCommand.Request) {
        return this.post<CreateInfraProviderCommand.Response>(REST_API.INFRA_BILLING.CREATE_PROVIDER, params);
    }

    async updateBillingProvider(params: UpdateInfraProviderCommand.Request) {
        return this.patch<UpdateInfraProviderCommand.Response>(REST_API.INFRA_BILLING.UPDATE_PROVIDER, params);
    }

    async deleteBillingProvider(uuid: string) {
        return this.delete<DeleteInfraProviderByUuidCommand.Response>(REST_API.INFRA_BILLING.DELETE_PROVIDER(uuid));
    }

    async getBillingNodes() {
        return this.get(REST_API.INFRA_BILLING.GET_BILLING_NODES);
    }

    async createBillingNode(params: CreateInfraBillingNodeCommand.Request) {
        return this.post<CreateInfraBillingNodeCommand.Response>(REST_API.INFRA_BILLING.CREATE_BILLING_NODE, params);
    }

    async updateBillingNode(params: UpdateInfraBillingNodeCommand.Request) {
        return this.patch<UpdateInfraBillingNodeCommand.Response>(REST_API.INFRA_BILLING.UPDATE_BILLING_NODE, params);
    }

    async deleteBillingNode(uuid: string) {
        return this.delete<DeleteInfraBillingNodeByUuidCommand.Response>(REST_API.INFRA_BILLING.DELETE_BILLING_NODE(uuid));
    }

    async getBillingHistory() {
        return this.get(REST_API.INFRA_BILLING.GET_BILLING_HISTORY);
    }

    async createBillingHistory(params: CreateInfraBillingHistoryRecordCommand.Request) {
        return this.post<CreateInfraBillingHistoryRecordCommand.Response>(REST_API.INFRA_BILLING.CREATE_BILLING_HISTORY, params);
    }

    async deleteBillingHistory(uuid: string) {
        return this.delete<DeleteInfraBillingHistoryRecordCommand.Response>(REST_API.INFRA_BILLING.DELETE_BILLING_HISTORY(uuid));
    }

    // Snippets

    async getSnippets() {
        return this.get(REST_API.SNIPPETS.GET);
    }

    async createSnippet(params: CreateSnippetCommand.Request) {
        return this.post<CreateSnippetCommand.Response>(REST_API.SNIPPETS.CREATE, params);
    }

    async updateSnippet(params: UpdateSnippetCommand.Request) {
        return this.patch<UpdateSnippetCommand.Response>(REST_API.SNIPPETS.UPDATE, params);
    }

    async deleteSnippet(params: DeleteSnippetCommand.Request) {
        return this.post<DeleteSnippetCommand.Response>(REST_API.SNIPPETS.DELETE, params);
    }

    // External Squads

    async getExternalSquads() {
        return this.get(REST_API.EXTERNAL_SQUADS.GET);
    }

    async getExternalSquadByUuid(uuid: string) {
        return this.get(REST_API.EXTERNAL_SQUADS.GET_BY_UUID(uuid));
    }

    async createExternalSquad(params: CreateExternalSquadCommand.Request) {
        return this.post<CreateExternalSquadCommand.Response>(REST_API.EXTERNAL_SQUADS.CREATE, params);
    }

    async updateExternalSquad(params: UpdateExternalSquadCommand.Request) {
        return this.patch<UpdateExternalSquadCommand.Response>(REST_API.EXTERNAL_SQUADS.UPDATE, params);
    }

    async deleteExternalSquad(uuid: string) {
        return this.delete<DeleteExternalSquadCommand.Response>(REST_API.EXTERNAL_SQUADS.DELETE(uuid));
    }

    async addUsersToExternalSquad(squadUuid: string, userUuids: string[]) {
        return this.post(
            REST_API.EXTERNAL_SQUADS.BULK_ACTIONS.ADD_USERS(squadUuid),
            { userUuids },
        );
    }

    async removeUsersFromExternalSquad(squadUuid: string, userUuids: string[]) {
        return this.post(
            REST_API.EXTERNAL_SQUADS.BULK_ACTIONS.REMOVE_USERS(squadUuid),
            { userUuids },
        );
    }

    async reorderExternalSquads(params: ReorderExternalSquadCommand.Request) {
        return this.post<ReorderExternalSquadCommand.Response>(REST_API.EXTERNAL_SQUADS.ACTIONS.REORDER, params);
    }

    // Settings

    async getSettings() {
        return this.get(REST_API.REMNAAWAVE_SETTINGS.GET);
    }

    async updateSettings(params: UpdateRemnawaveSettingsCommand.Request) {
        return this.patch<UpdateRemnawaveSettingsCommand.Response>(REST_API.REMNAAWAVE_SETTINGS.UPDATE, params);
    }

    // Subscription Page Configs

    async getSubscriptionPageConfigs() {
        return this.get(REST_API.SUBSCRIPTION_PAGE_CONFIGS.GET_ALL);
    }

    async getSubscriptionPageConfig(uuid: string) {
        return this.get(REST_API.SUBSCRIPTION_PAGE_CONFIGS.GET(uuid));
    }

    async createSubscriptionPageConfig(params: CreateSubscriptionPageConfigCommand.Request) {
        return this.post<CreateSubscriptionPageConfigCommand.Response>(REST_API.SUBSCRIPTION_PAGE_CONFIGS.CREATE, params);
    }

    async updateSubscriptionPageConfig(params: UpdateSubscriptionPageConfigCommand.Request) {
        return this.patch<UpdateSubscriptionPageConfigCommand.Response>(REST_API.SUBSCRIPTION_PAGE_CONFIGS.UPDATE, params);
    }

    async deleteSubscriptionPageConfig(uuid: string) {
        return this.delete<DeleteSubscriptionPageConfigCommand.Response>(REST_API.SUBSCRIPTION_PAGE_CONFIGS.DELETE(uuid));
    }

    async reorderSubscriptionPageConfigs(params: ReorderSubscriptionPageConfigsCommand.Request) {
        return this.post<ReorderSubscriptionPageConfigsCommand.Response>(REST_API.SUBSCRIPTION_PAGE_CONFIGS.ACTIONS.REORDER, params);
    }

    async cloneSubscriptionPageConfig(params: CloneSubscriptionPageConfigCommand.Request) {
        return this.post<CloneSubscriptionPageConfigCommand.Response>(REST_API.SUBSCRIPTION_PAGE_CONFIGS.ACTIONS.CLONE, params);
    }

    // Node Plugins

    async getNodePlugins() {
        return this.get(REST_API.NODE_PLUGINS.GET_ALL);
    }

    async getNodePlugin(uuid: string) {
        return this.get(REST_API.NODE_PLUGINS.GET(uuid));
    }

    async createNodePlugin(params: CreateNodePluginCommand.Request) {
        return this.post<CreateNodePluginCommand.Response>(REST_API.NODE_PLUGINS.CREATE, params);
    }

    async updateNodePlugin(params: UpdateNodePluginCommand.Request) {
        return this.patch<UpdateNodePluginCommand.Response>(REST_API.NODE_PLUGINS.UPDATE, params);
    }

    async deleteNodePlugin(uuid: string) {
        return this.delete<DeleteNodePluginCommand.Response>(REST_API.NODE_PLUGINS.DELETE(uuid));
    }

    async reorderNodePlugins(params: ReorderNodePluginCommand.Request) {
        return this.post<ReorderNodePluginCommand.Response>(REST_API.NODE_PLUGINS.ACTIONS.REORDER, params);
    }

    async cloneNodePlugin(params: CloneNodePluginCommand.Request) {
        return this.post<CloneNodePluginCommand.Response>(REST_API.NODE_PLUGINS.ACTIONS.CLONE, params);
    }

    async executeNodePlugin(params: PluginExecutorCommand.Request) {
        return this.post<PluginExecutorCommand.Response>(REST_API.NODE_PLUGINS.EXECUTOR, params);
    }

    async getTorrentBlockerReports() {
        return this.get(REST_API.NODE_PLUGINS.TORRENT_BLOCKER.GET_REPORTS);
    }

    async getTorrentBlockerStats() {
        return this.get(REST_API.NODE_PLUGINS.TORRENT_BLOCKER.GET_REPORTS_STATS);
    }

    async truncateTorrentBlockerReports() {
        return this.post(REST_API.NODE_PLUGINS.TORRENT_BLOCKER.TRUNCATE_REPORTS);
    }

    // IP Control

    async fetchIps(uuid: string) {
        return this.post(REST_API.IP_CONTROL.FETCH_IPS(uuid));
    }

    async getFetchIpsResult(jobId: string) {
        return this.get(REST_API.IP_CONTROL.GET_FETCH_IPS_RESULT(jobId));
    }

    async dropConnections(params: DropConnectionsCommand.Request) {
        return this.post<DropConnectionsCommand.Response>(REST_API.IP_CONTROL.DROP_CONNECTIONS, params);
    }

    async fetchUsersIps(nodeUuid: string) {
        return this.post(REST_API.IP_CONTROL.FETCH_USERS_IPS(nodeUuid));
    }

    async getFetchUsersIpsResult(jobId: string) {
        return this.get(REST_API.IP_CONTROL.GET_FETCH_USERS_IPS_RESULT(jobId));
    }

    // Metadata

    async getNodeMetadata(uuid: string) {
        return this.get(REST_API.METADATA.NODE.GET(uuid));
    }

    async upsertNodeMetadata(uuid: string, params: Record<string, unknown>) {
        return this.put(REST_API.METADATA.NODE.UPSERT(uuid), params);
    }

    async getUserMetadata(uuid: string) {
        return this.get(REST_API.METADATA.USER.GET(uuid));
    }

    async upsertUserMetadata(uuid: string, params: Record<string, unknown>) {
        return this.put(REST_API.METADATA.USER.UPSERT(uuid), params);
    }
}
