// Panel request routes pinned to @remnawave/backend-contract 3.4.2.
package remnawave

func (e *executor) getUsers(args ...any) any {
	vars := object{}
	_ = vars
	vars["start"] = arg(args, 0, 0)
	vars["size"] = arg(args, 1, 25)
	return e.request("GET", ("" + str("/api/users/") + "?start=" + str(vars["start"]) + "&size=" + str(vars["size"]) + ""))
}

func (e *executor) getUserById(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("GET", ("/api/users/" + str(str(vars["userId"])) + ""))
}

func (e *executor) getUserByUsername(args ...any) any {
	vars := object{}
	_ = vars
	vars["username"] = arg(args, 0, undef)
	return e.request("GET", ("/api/users/by-username/" + str(vars["username"]) + ""))
}

func (e *executor) getUserByShortUuid(args ...any) any {
	vars := object{}
	_ = vars
	vars["shortUuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/users/by-short-uuid/" + str(vars["shortUuid"]) + ""))
}

func (e *executor) getUsersByTelegramId(args ...any) any {
	vars := object{}
	_ = vars
	vars["telegramId"] = arg(args, 0, undef)
	vars["size"] = arg(args, 1, 25)
	return e.request("GET", ("" + str("/api/users/stream") + "?telegramId=" + str(vars["telegramId"]) + "&size=" + str(vars["size"]) + ""))
}

func (e *executor) getUserAccessibleNodes(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("GET", ("/api/users/" + str(str(vars["userId"])) + "/accessible-nodes"))
}

func (e *executor) getUserTags(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/users/tags")
}

func (e *executor) resolveUsers(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/resolve", vars["params"])
}

func (e *executor) createUser(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/", vars["params"])
}

func (e *executor) updateUser(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/users/", vars["params"])
}

func (e *executor) deleteUser(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/users/" + str(str(vars["userId"])) + ""))
}

func (e *executor) enableUser(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("POST", ("/api/users/" + str(str(vars["userId"])) + "/actions/enable"))
}

func (e *executor) disableUser(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("POST", ("/api/users/" + str(str(vars["userId"])) + "/actions/disable"))
}

func (e *executor) revokeUserSubscription(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("POST", ("/api/users/" + str(str(vars["userId"])) + "/actions/revoke"))
}

func (e *executor) resetUserTraffic(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("POST", ("/api/users/" + str(str(vars["userId"])) + "/actions/reset-traffic"))
}

func (e *executor) extendUser(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	vars["params"] = arg(args, 1, undef)
	return e.request("POST", ("/api/users/" + str(str(vars["userId"])) + "/actions/extend"), vars["params"])
}

func (e *executor) bulkDeleteUsersByStatus(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/bulk/delete-by-status", vars["params"])
}

func (e *executor) bulkUpdateUsers(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/bulk/update", vars["params"])
}

func (e *executor) bulkResetUsersTraffic(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/bulk/reset-traffic", vars["params"])
}

func (e *executor) bulkRevokeUsersSubscription(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/bulk/revoke-subscription", vars["params"])
}

func (e *executor) bulkDeleteUsers(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/bulk/delete", vars["params"])
}

func (e *executor) bulkUpdateUserSquads(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/bulk/update-squads", vars["params"])
}

func (e *executor) bulkExtendUsersExpiration(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/bulk/extend-expiration-date", vars["params"])
}

func (e *executor) bulkAllUpdateUsers(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/bulk/all/update", vars["params"])
}

func (e *executor) bulkAllResetUsersTraffic(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("POST", "/api/users/bulk/all/reset-traffic")
}

func (e *executor) bulkAllExtendUsersExpiration(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/users/bulk/all/extend-expiration-date", vars["params"])
}

func (e *executor) getNodes(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/nodes/")
}

func (e *executor) getNodeByUuid(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/nodes/" + str(vars["uuid"]) + ""))
}

func (e *executor) getNodeTags(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/nodes/tags")
}

func (e *executor) createNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/nodes/", vars["params"])
}

func (e *executor) updateNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/nodes/", vars["params"])
}

func (e *executor) deleteNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/nodes/" + str(vars["uuid"]) + ""))
}

func (e *executor) enableNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("POST", ("/api/nodes/" + str(vars["uuid"]) + "/actions/enable"))
}

func (e *executor) disableNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("POST", ("/api/nodes/" + str(vars["uuid"]) + "/actions/disable"))
}

func (e *executor) restartNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	vars["forceRestart"] = arg(args, 1, undef)
	return e.request("POST", ("/api/nodes/" + str(vars["uuid"]) + "/actions/restart"), merge(object{"forceRestart": vars["forceRestart"]}))
}

func (e *executor) restartAllNodes(args ...any) any {
	vars := object{}
	_ = vars
	vars["forceRestart"] = arg(args, 0, undef)
	return e.request("POST", "/api/nodes/actions/restart-all", merge(object{"forceRestart": vars["forceRestart"]}))
}

func (e *executor) resetNodeTraffic(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("POST", ("/api/nodes/" + str(vars["uuid"]) + "/actions/reset-traffic"))
}

func (e *executor) reorderNodes(args ...any) any {
	vars := object{}
	_ = vars
	vars["nodes"] = arg(args, 0, undef)
	return e.request("POST", "/api/nodes/actions/reorder", merge(object{"nodes": vars["nodes"]}))
}

func (e *executor) bulkNodeProfileModification(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/nodes/bulk-actions/profile-modification", vars["params"])
}

func (e *executor) bulkNodeActions(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/nodes/bulk-actions", vars["params"])
}

func (e *executor) bulkUpdateNodes(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/nodes/bulk-actions/update", vars["params"])
}

func (e *executor) getHosts(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/hosts/")
}

func (e *executor) getHostByUuid(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/hosts/" + str(vars["uuid"]) + ""))
}

func (e *executor) getHostTags(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/hosts/tags")
}

func (e *executor) createHost(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/hosts/", vars["params"])
}

func (e *executor) updateHost(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/hosts/", vars["params"])
}

func (e *executor) deleteHost(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/hosts/" + str(vars["uuid"]) + ""))
}

func (e *executor) bulkEnableHosts(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/hosts/bulk/enable", vars["params"])
}

func (e *executor) bulkDisableHosts(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/hosts/bulk/disable", vars["params"])
}

func (e *executor) bulkDeleteHosts(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/hosts/bulk/delete", vars["params"])
}

func (e *executor) bulkSetHostInbound(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/hosts/bulk/update", vars["params"])
}

func (e *executor) bulkSetHostPort(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/hosts/bulk/update", vars["params"])
}

func (e *executor) getStats(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/stats")
}

func (e *executor) getBandwidthStats(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/stats/bandwidth")
}

func (e *executor) getNodesMetrics(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/nodes/metrics")
}

func (e *executor) getNodesStatistics(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/stats/nodes")
}

func (e *executor) getStatsRecap(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/stats/recap")
}

func (e *executor) getStatsDigest(args ...any) any {
	vars := object{}
	_ = vars
	vars["query"] = arg(args, 0, undef)
	return e.request("GET", ("" + str("/api/system/stats/digest") + "" + str(query(vars["query"])) + ""))
}

func (e *executor) getHttpStats(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/stats/http")
}

func (e *executor) getConfiguration(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/configuration")
}

func (e *executor) getHealth(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/health")
}

func (e *executor) getSystemMetadata(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/metadata")
}

func (e *executor) generateX25519(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/system/tools/x25519/generate")
}

func (e *executor) testSrrMatcher(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/system/testers/srr-matcher", vars["params"])
}

func (e *executor) getSubscriptions(args ...any) any {
	vars := object{}
	_ = vars
	vars["start"] = arg(args, 0, 0)
	vars["size"] = arg(args, 1, 25)
	return e.request("GET", ("" + str("/api/subscriptions/") + "?start=" + str(vars["start"]) + "&size=" + str(vars["size"]) + ""))
}

func (e *executor) getSubscriptionByUserId(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("GET", ("/api/subscriptions/by-id/" + str(str(vars["userId"])) + ""))
}

func (e *executor) getSubscriptionByUsername(args ...any) any {
	vars := object{}
	_ = vars
	vars["username"] = arg(args, 0, undef)
	return e.request("GET", ("/api/subscriptions/by-username/" + str(vars["username"]) + ""))
}

func (e *executor) getSubscriptionByShortUuid(args ...any) any {
	vars := object{}
	_ = vars
	vars["shortUuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/subscriptions/by-short-uuid/" + str(vars["shortUuid"]) + ""))
}

func (e *executor) getSubscriptionByShortUuidRaw(args ...any) any {
	vars := object{}
	_ = vars
	vars["shortUuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/subscriptions/by-short-uuid/" + str(vars["shortUuid"]) + "/raw"))
}

func (e *executor) getSubscriptionSubpageConfig(args ...any) any {
	vars := object{}
	_ = vars
	vars["shortUuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/subscriptions/subpage-config/" + str(vars["shortUuid"]) + ""))
}

func (e *executor) getConnectionKeysByUserId(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("GET", ("/api/subscriptions/connection-keys/" + str(str(vars["userId"])) + ""))
}

func (e *executor) getSubscriptionInfo(args ...any) any {
	vars := object{}
	_ = vars
	vars["shortUuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/sub/" + str(vars["shortUuid"]) + "/info"))
}

func (e *executor) getSubscriptionRequestHistory(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/subscription-request-history/")
}

func (e *executor) getSubscriptionRequestHistoryStats(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/subscription-request-history/stats")
}

func (e *executor) getConfigProfiles(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/config-profiles/")
}

func (e *executor) getConfigProfileByUuid(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/config-profiles/" + str(vars["uuid"]) + ""))
}

func (e *executor) getAllInbounds(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/config-profiles/inbounds")
}

func (e *executor) getInboundsByProfileUuid(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/config-profiles/" + str(vars["uuid"]) + "/inbounds"))
}

func (e *executor) getComputedConfigByProfileUuid(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/config-profiles/" + str(vars["uuid"]) + "/computed-config"))
}

func (e *executor) createConfigProfile(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/config-profiles/", vars["params"])
}

func (e *executor) updateConfigProfile(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/config-profiles/", vars["params"])
}

func (e *executor) deleteConfigProfile(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/config-profiles/" + str(vars["uuid"]) + ""))
}

func (e *executor) reorderConfigProfiles(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/config-profiles/actions/reorder", vars["params"])
}

func (e *executor) getInternalSquads(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/internal-squads/")
}

func (e *executor) getSquadAccessibleNodes(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/internal-squads/" + str(vars["uuid"]) + "/accessible-nodes"))
}

func (e *executor) createInternalSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/internal-squads/", vars["params"])
}

func (e *executor) updateInternalSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/internal-squads/", vars["params"])
}

func (e *executor) deleteInternalSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/internal-squads/" + str(vars["uuid"]) + ""))
}

func (e *executor) addAllUsersToSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["squadUuid"] = arg(args, 0, undef)
	return e.request("POST", ("/api/internal-squads/" + str(vars["squadUuid"]) + "/bulk-actions/add-users"))
}

func (e *executor) removeAllUsersFromSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["squadUuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/internal-squads/" + str(vars["squadUuid"]) + "/bulk-actions/remove-users"))
}

func (e *executor) addManyUsersToSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["squadUuid"] = arg(args, 0, undef)
	vars["params"] = arg(args, 1, undef)
	return e.request("POST", ("/api/internal-squads/" + str(vars["squadUuid"]) + "/bulk-actions/add-many-users"), vars["params"])
}

func (e *executor) removeManyUsersFromSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["squadUuid"] = arg(args, 0, undef)
	vars["params"] = arg(args, 1, undef)
	return e.request("DELETE", ("/api/internal-squads/" + str(vars["squadUuid"]) + "/bulk-actions/remove-many-users"), vars["params"])
}

func (e *executor) getUserHwidDevices(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("GET", ("/api/hwid/devices/" + str(str(vars["userId"])) + ""))
}

func (e *executor) getAllHwidDevices(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/hwid/devices")
}

func (e *executor) getHwidStats(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/hwid/devices/stats")
}

func (e *executor) getHwidTopUsers(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/hwid/devices/top-users")
}

func (e *executor) createUserHwidDevice(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/hwid/devices", vars["params"])
}

func (e *executor) deleteHwidDevice(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/hwid/devices/delete", vars["params"])
}

func (e *executor) deleteAllUserHwidDevices(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/hwid/devices/delete-all", vars["params"])
}

func (e *executor) getNodesBandwidth(args ...any) any {
	vars := object{}
	_ = vars
	vars["query"] = arg(args, 0, undef)
	return e.request("GET", ("" + str("/api/bandwidth-stats/nodes/") + "" + str(query(vars["query"])) + ""))
}

func (e *executor) getNodesRealtimeBandwidth(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/bandwidth-stats/nodes/realtime")
}

func (e *executor) getUserBandwidthByUserId(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	vars["query"] = arg(args, 1, undef)
	return e.request("GET", ("" + str(("/api/bandwidth-stats/users/" + str(str(vars["userId"])) + "")) + "" + str(query(vars["query"])) + ""))
}

func (e *executor) getNodesUsage(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	vars["query"] = arg(args, 1, undef)
	return e.request("POST", ("" + str("/api/bandwidth-stats/nodes/usage") + "" + str(query(vars["query"])) + ""), vars["params"])
}

func (e *executor) getInternalSquadUsage(args ...any) any {
	vars := object{}
	_ = vars
	vars["squadUuid"] = arg(args, 0, undef)
	vars["query"] = arg(args, 1, undef)
	return e.request("GET", ("" + str(("/api/bandwidth-stats/internal-squads/" + str(vars["squadUuid"]) + "/usage")) + "" + str(query(vars["query"])) + ""))
}

func (e *executor) getInternalSquadUserUsage(args ...any) any {
	vars := object{}
	_ = vars
	vars["squadUuid"] = arg(args, 0, undef)
	vars["userId"] = arg(args, 1, undef)
	vars["query"] = arg(args, 2, undef)
	return e.request("GET", ("" + str(("/api/bandwidth-stats/internal-squads/" + str(vars["squadUuid"]) + "/users/" + str(str(vars["userId"])) + "/usage")) + "" + str(query(vars["query"])) + ""))
}

func (e *executor) getAuthStatus(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/auth/status")
}

func (e *executor) getApiTokens(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/tokens/")
}

func (e *executor) createApiToken(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/tokens/", vars["params"])
}

func (e *executor) deleteApiToken(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/tokens/" + str(vars["uuid"]) + ""))
}

func (e *executor) getOtt(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("POST", "/api/tokens/ott")
}

func (e *executor) getKeygen(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/keygen/")
}

func (e *executor) getBillingProviders(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/infra-billing/providers")
}

func (e *executor) getBillingProviderByUuid(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/infra-billing/providers/" + str(vars["uuid"]) + ""))
}

func (e *executor) createBillingProvider(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/infra-billing/providers", vars["params"])
}

func (e *executor) updateBillingProvider(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/infra-billing/providers", vars["params"])
}

func (e *executor) deleteBillingProvider(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/infra-billing/providers/" + str(vars["uuid"]) + ""))
}

func (e *executor) getBillingNodes(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/infra-billing/nodes")
}

func (e *executor) createBillingNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/infra-billing/nodes", vars["params"])
}

func (e *executor) updateBillingNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/infra-billing/nodes", vars["params"])
}

func (e *executor) deleteBillingNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/infra-billing/nodes/" + str(vars["uuid"]) + ""))
}

func (e *executor) getBillingHistory(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/infra-billing/history")
}

func (e *executor) createBillingHistory(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/infra-billing/history", vars["params"])
}

func (e *executor) deleteBillingHistory(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/infra-billing/history/" + str(vars["uuid"]) + ""))
}

func (e *executor) getSnippets(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/snippets/")
}

func (e *executor) createSnippet(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/snippets/", vars["params"])
}

func (e *executor) updateSnippet(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/snippets/", vars["params"])
}

func (e *executor) deleteSnippet(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("DELETE", "/api/snippets/", vars["params"])
}

func (e *executor) syncSnippet(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/snippets/actions/sync", vars["params"])
}

func (e *executor) getExternalSquads(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/external-squads/")
}

func (e *executor) getExternalSquadByUuid(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/external-squads/" + str(vars["uuid"]) + ""))
}

func (e *executor) createExternalSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/external-squads/", vars["params"])
}

func (e *executor) updateExternalSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/external-squads/", vars["params"])
}

func (e *executor) deleteExternalSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/external-squads/" + str(vars["uuid"]) + ""))
}

func (e *executor) addAllUsersToExternalSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["squadUuid"] = arg(args, 0, undef)
	return e.request("POST", ("/api/external-squads/" + str(vars["squadUuid"]) + "/bulk-actions/add-users"))
}

func (e *executor) removeAllUsersFromExternalSquad(args ...any) any {
	vars := object{}
	_ = vars
	vars["squadUuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/external-squads/" + str(vars["squadUuid"]) + "/bulk-actions/remove-users"))
}

func (e *executor) reorderExternalSquads(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/external-squads/actions/reorder", vars["params"])
}

func (e *executor) getSettings(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/remnawave-settings/")
}

func (e *executor) updateSettings(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/remnawave-settings/", vars["params"])
}

func (e *executor) getSubscriptionPageConfigs(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/subscription-page-configs/")
}

func (e *executor) getSubscriptionPageConfig(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/subscription-page-configs/" + str(vars["uuid"]) + ""))
}

func (e *executor) createSubscriptionPageConfig(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/subscription-page-configs/", vars["params"])
}

func (e *executor) updateSubscriptionPageConfig(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/subscription-page-configs/", vars["params"])
}

func (e *executor) deleteSubscriptionPageConfig(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/subscription-page-configs/" + str(vars["uuid"]) + ""))
}

func (e *executor) reorderSubscriptionPageConfigs(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/subscription-page-configs/actions/reorder", vars["params"])
}

func (e *executor) cloneSubscriptionPageConfig(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/subscription-page-configs/actions/clone", vars["params"])
}

func (e *executor) getNodePlugins(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/node-plugins/")
}

func (e *executor) getNodePlugin(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/node-plugins/" + str(vars["uuid"]) + ""))
}

func (e *executor) createNodePlugin(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/node-plugins/", vars["params"])
}

func (e *executor) updateNodePlugin(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/node-plugins/", vars["params"])
}

func (e *executor) deleteNodePlugin(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/node-plugins/" + str(vars["uuid"]) + ""))
}

func (e *executor) reorderNodePlugins(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/node-plugins/actions/reorder", vars["params"])
}

func (e *executor) cloneNodePlugin(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/node-plugins/actions/clone", vars["params"])
}

func (e *executor) syncNodePlugin(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/node-plugins/actions/sync", vars["params"])
}

func (e *executor) executeNodePlugin(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/node-plugins/executor", vars["params"])
}

func (e *executor) getTorrentBlockerReports(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/node-plugins/torrent-blocker")
}

func (e *executor) getTorrentBlockerStats(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/node-plugins/torrent-blocker/stats")
}

func (e *executor) truncateTorrentBlockerReports(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("DELETE", "/api/node-plugins/torrent-blocker/truncate")
}

func (e *executor) getSharedLists(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/node-plugins/shared-lists")
}

func (e *executor) getSharedList(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/node-plugins/shared-lists/" + str(vars["uuid"]) + ""))
}

func (e *executor) createSharedList(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/node-plugins/shared-lists", vars["params"])
}

func (e *executor) updateSharedList(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/node-plugins/shared-lists", vars["params"])
}

func (e *executor) deleteSharedList(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/node-plugins/shared-lists/" + str(vars["uuid"]) + ""))
}

func (e *executor) syncSharedList(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/node-plugins/shared-lists/actions/sync", vars["params"])
}

func (e *executor) getNodeIntegrations(args ...any) any {
	vars := object{}
	_ = vars
	return e.request("GET", "/api/node-integrations/")
}

func (e *executor) getNodeIntegration(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/node-integrations/" + str(vars["uuid"]) + ""))
}

func (e *executor) createNodeIntegration(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/node-integrations/", vars["params"])
}

func (e *executor) updateNodeIntegration(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("PATCH", "/api/node-integrations/", vars["params"])
}

func (e *executor) deleteNodeIntegration(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("DELETE", ("/api/node-integrations/" + str(vars["uuid"]) + ""))
}

func (e *executor) connectionsByUser(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("POST", ("/api/connections/by-user/" + str(str(vars["userId"])) + ""))
}

func (e *executor) connectionsByUserResult(args ...any) any {
	vars := object{}
	_ = vars
	vars["jobId"] = arg(args, 0, undef)
	return e.request("GET", ("/api/connections/by-user/" + str(vars["jobId"]) + ""))
}

func (e *executor) connectionsByNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["nodeUuid"] = arg(args, 0, undef)
	return e.request("POST", ("/api/connections/by-node/" + str(vars["nodeUuid"]) + ""))
}

func (e *executor) connectionsByNodeResult(args ...any) any {
	vars := object{}
	_ = vars
	vars["jobId"] = arg(args, 0, undef)
	return e.request("GET", ("/api/connections/by-node/" + str(vars["jobId"]) + ""))
}

func (e *executor) dropConnections(args ...any) any {
	vars := object{}
	_ = vars
	vars["params"] = arg(args, 0, undef)
	return e.request("POST", "/api/connections/drop", vars["params"])
}

func (e *executor) geocheckByNode(args ...any) any {
	vars := object{}
	_ = vars
	vars["nodeUuid"] = arg(args, 0, undef)
	return e.request("POST", ("/api/connections/geocheck/" + str(vars["nodeUuid"]) + ""))
}

func (e *executor) geocheckByNodeResult(args ...any) any {
	vars := object{}
	_ = vars
	vars["jobId"] = arg(args, 0, undef)
	return e.request("GET", ("/api/connections/geocheck/" + str(vars["jobId"]) + ""))
}

func (e *executor) getNodeMetadata(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	return e.request("GET", ("/api/metadata/node/" + str(vars["uuid"]) + ""))
}

func (e *executor) upsertNodeMetadata(args ...any) any {
	vars := object{}
	_ = vars
	vars["uuid"] = arg(args, 0, undef)
	vars["params"] = arg(args, 1, undef)
	return e.request("PUT", ("/api/metadata/node/" + str(vars["uuid"]) + ""), merge(object{"metadata": vars["params"]}))
}

func (e *executor) getUserMetadata(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	return e.request("GET", ("/api/metadata/user/" + str(str(vars["userId"])) + ""))
}

func (e *executor) upsertUserMetadata(args ...any) any {
	vars := object{}
	_ = vars
	vars["userId"] = arg(args, 0, undef)
	vars["params"] = arg(args, 1, undef)
	return e.request("PUT", ("/api/metadata/user/" + str(str(vars["userId"])) + ""), merge(object{"metadata": vars["params"]}))
}
