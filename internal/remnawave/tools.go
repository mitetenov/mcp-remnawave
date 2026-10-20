// Tool contracts and request mappings ported from Remnawave MCP 3.3.0.
package remnawave

func runTool(e *executor, name string, args object) any {
	if e.config.Support {
		switch name {
		case "hwid_devices_list":
			return e.getSupportHwidDevicesByTelegramID(get(args, "telegramId"))
		case "hwid_device_delete":
			return e.deleteSupportHwidDeviceByTelegramID(get(args, "telegramId"), get(args, "userId"), get(args, "hwid"))
		}
	}
	vars := object{}
	_ = vars
	switch name {
	case "users_list":
		{
			vars["start"] = get(args, "start")
			vars["size"] = get(args, "size")
			vars["result"] = e.getUsers(vars["start"], vars["size"])
			return vars["result"]
		}
	case "users_get":
		{
			vars["userId"] = get(args, "userId")
			vars["result"] = e.getUserById(vars["userId"])
			return vars["result"]
		}
	case "users_get_by_username":
		{
			vars["username"] = get(args, "username")
			vars["result"] = e.getUserByUsername(vars["username"])
			return vars["result"]
		}
	case "users_get_by_short_uuid":
		{
			vars["shortUuid"] = get(args, "shortUuid")
			vars["result"] = e.getUserByShortUuid(vars["shortUuid"])
			return vars["result"]
		}
	case "users_get_by_telegram_id":
		{
			vars["telegramId"] = get(args, "telegramId")
			vars["size"] = get(args, "size")
			vars["result"] = e.getUsersByTelegramId(vars["telegramId"], vars["size"])
			return vars["result"]
		}
	case "users_get_subscription_url_by_telegram_id":
		{
			vars["telegramId"] = get(args, "telegramId")
			vars["result"] = e.getUsersByTelegramId(vars["telegramId"])
			return subscriptionURL(vars["result"])
		}
	case "users_accessible_nodes":
		{
			vars["userId"] = get(args, "userId")
			vars["result"] = e.getUserAccessibleNodes(vars["userId"])
			return vars["result"]
		}
	case "users_tags_list":
		{
			vars["result"] = e.getUserTags()
			return vars["result"]
		}
	case "users_resolve":
		{
			vars["params"] = args
			vars["result"] = e.resolveUsers(vars["params"])
			return vars["result"]
		}
	case "users_create":
		{
			vars["params"] = args
			vars["result"] = e.createUser(merge(vars["params"], object{"expireAt": date(get(vars["params"], "expireAt"))}))
			return vars["result"]
		}
	case "users_update":
		{
			vars["params"] = args
			vars["result"] = e.updateUser(merge(vars["params"], object{"expireAt": choose(get(vars["params"], "expireAt"), date(get(vars["params"], "expireAt")), undef)}))
			return vars["result"]
		}
	case "users_delete":
		{
			vars["userId"] = get(args, "userId")
			_ = e.deleteUser(vars["userId"])
			return merge(object{"success": true}, object{"message": ("User " + str(vars["userId"]) + " deleted")})
		}
	case "users_enable":
		{
			vars["userId"] = get(args, "userId")
			vars["result"] = e.enableUser(vars["userId"])
			return vars["result"]
		}
	case "users_disable":
		{
			vars["userId"] = get(args, "userId")
			vars["result"] = e.disableUser(vars["userId"])
			return vars["result"]
		}
	case "users_revoke_subscription":
		{
			vars["userId"] = get(args, "userId")
			vars["result"] = e.revokeUserSubscription(vars["userId"])
			return vars["result"]
		}
	case "users_reset_traffic":
		{
			vars["userId"] = get(args, "userId")
			vars["result"] = e.resetUserTraffic(vars["userId"])
			return vars["result"]
		}
	case "users_extend_expiration":
		{
			vars["userId"] = get(args, "userId")
			vars["days"] = get(args, "days")
			vars["result"] = e.extendUser(vars["userId"], merge(object{"days": vars["days"]}))
			return vars["result"]
		}
	case "users_bulk_delete_by_status":
		{
			vars["params"] = args
			vars["result"] = e.bulkDeleteUsersByStatus(vars["params"])
			return vars["result"]
		}
	case "users_bulk_update":
		{
			vars["params"] = args
			vars["userIds"] = get(vars["params"], "userIds")
			vars["fields"] = without(vars["params"], "userIds")
			vars["result"] = e.bulkUpdateUsers(merge(object{"userIds": vars["userIds"]}, object{"fields": merge(vars["fields"], object{"expireAt": choose(get(vars["fields"], "expireAt"), date(get(vars["fields"], "expireAt")), undef)})}))
			return vars["result"]
		}
	case "users_bulk_reset_traffic":
		{
			vars["params"] = args
			vars["result"] = e.bulkResetUsersTraffic(vars["params"])
			return vars["result"]
		}
	case "users_bulk_revoke_subscription":
		{
			vars["params"] = args
			vars["result"] = e.bulkRevokeUsersSubscription(vars["params"])
			return vars["result"]
		}
	case "users_bulk_delete":
		{
			vars["params"] = args
			vars["result"] = e.bulkDeleteUsers(vars["params"])
			return vars["result"]
		}
	case "users_bulk_update_squads":
		{
			vars["params"] = args
			vars["result"] = e.bulkUpdateUserSquads(vars["params"])
			return vars["result"]
		}
	case "users_bulk_extend_expiration":
		{
			vars["params"] = args
			vars["result"] = e.bulkExtendUsersExpiration(vars["params"])
			return vars["result"]
		}
	case "users_bulk_all_update":
		{
			vars["params"] = args
			vars["result"] = e.bulkAllUpdateUsers(merge(vars["params"], object{"expireAt": choose(get(vars["params"], "expireAt"), date(get(vars["params"], "expireAt")), undef)}))
			return vars["result"]
		}
	case "users_bulk_all_reset_traffic":
		{
			vars["result"] = e.bulkAllResetUsersTraffic()
			return vars["result"]
		}
	case "users_bulk_all_extend_expiration":
		{
			vars["params"] = args
			vars["result"] = e.bulkAllExtendUsersExpiration(vars["params"])
			return vars["result"]
		}
	case "nodes_list":
		{
			vars["result"] = e.getNodes()
			return vars["result"]
		}
	case "nodes_get":
		{
			vars["uuid"] = get(args, "uuid")
			vars["result"] = e.getNodeByUuid(vars["uuid"])
			return vars["result"]
		}
	case "nodes_tags_list":
		{
			vars["result"] = e.getNodeTags()
			return vars["result"]
		}
	case "nodes_create":
		{
			vars["params"] = args
			vars["body"] = merge(object{"name": get(vars["params"], "name")}, object{"address": get(vars["params"], "address")}, object{"configProfile": merge(object{"activeConfigProfileUuid": get(vars["params"], "activeConfigProfileUuid")}, object{"activeInbounds": get(vars["params"], "activeInbounds")})})
			if truth(!equal(get(vars["params"], "port"), undef)) {
				set(vars["body"], "port", get(vars["params"], "port"))
			}
			if truth(!equal(get(vars["params"], "countryCode"), undef)) {
				set(vars["body"], "countryCode", get(vars["params"], "countryCode"))
			}
			if truth(!equal(get(vars["params"], "isTrafficTrackingActive"), undef)) {
				set(vars["body"], "isTrafficTrackingActive", get(vars["params"], "isTrafficTrackingActive"))
			}
			if truth(!equal(get(vars["params"], "trafficLimitBytes"), undef)) {
				set(vars["body"], "trafficLimitBytes", get(vars["params"], "trafficLimitBytes"))
			}
			if truth(!equal(get(vars["params"], "trafficResetDay"), undef)) {
				set(vars["body"], "trafficResetDay", get(vars["params"], "trafficResetDay"))
			}
			if truth(!equal(get(vars["params"], "notifyPercent"), undef)) {
				set(vars["body"], "notifyPercent", get(vars["params"], "notifyPercent"))
			}
			if truth(!equal(get(vars["params"], "consumptionMultiplier"), undef)) {
				set(vars["body"], "consumptionMultiplier", get(vars["params"], "consumptionMultiplier"))
			}
			if truth(!equal(get(vars["params"], "nodeConsumptionMultiplier"), undef)) {
				set(vars["body"], "nodeConsumptionMultiplier", get(vars["params"], "nodeConsumptionMultiplier"))
			}
			if truth(!equal(get(vars["params"], "note"), undef)) {
				set(vars["body"], "note", get(vars["params"], "note"))
			}
			if truth(!equal(get(vars["params"], "proxyUrl"), undef)) {
				set(vars["body"], "proxyUrl", get(vars["params"], "proxyUrl"))
			}
			vars["result"] = e.createNode(vars["body"])
			return vars["result"]
		}
	case "nodes_update":
		{
			vars["params"] = args
			vars["result"] = e.updateNode(vars["params"])
			return vars["result"]
		}
	case "nodes_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteNode(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Node " + str(vars["uuid"]) + " deleted")})
		}
	case "nodes_enable":
		{
			vars["uuid"] = get(args, "uuid")
			vars["result"] = e.enableNode(vars["uuid"])
			return vars["result"]
		}
	case "nodes_disable":
		{
			vars["uuid"] = get(args, "uuid")
			vars["result"] = e.disableNode(vars["uuid"])
			return vars["result"]
		}
	case "nodes_restart":
		{
			vars["uuid"] = get(args, "uuid")
			vars["forceRestart"] = get(args, "forceRestart")
			vars["result"] = e.restartNode(vars["uuid"], vars["forceRestart"])
			return vars["result"]
		}
	case "nodes_restart_all":
		{
			vars["forceRestart"] = get(args, "forceRestart")
			vars["result"] = e.restartAllNodes(vars["forceRestart"])
			return vars["result"]
		}
	case "nodes_reset_traffic":
		{
			vars["uuid"] = get(args, "uuid")
			vars["result"] = e.resetNodeTraffic(vars["uuid"])
			return vars["result"]
		}
	case "nodes_reorder":
		{
			vars["nodes"] = get(args, "nodes")
			vars["result"] = e.reorderNodes(vars["nodes"])
			return vars["result"]
		}
	case "nodes_bulk_profile_modification":
		{
			vars["params"] = args
			vars["body"] = merge(object{"uuids": get(vars["params"], "uuids")}, object{"configProfile": merge(object{"activeConfigProfileUuid": get(vars["params"], "configProfileUuid")}, object{"activeInbounds": get(vars["params"], "activeInbounds")})})
			vars["result"] = e.bulkNodeProfileModification(vars["body"])
			return vars["result"]
		}
	case "nodes_bulk_actions":
		{
			vars["params"] = args
			vars["result"] = e.bulkNodeActions(vars["params"])
			return vars["result"]
		}
	case "nodes_bulk_update":
		{
			vars["params"] = args
			vars["uuids"] = get(vars["params"], "uuids")
			vars["fields"] = without(vars["params"], "uuids")
			vars["result"] = e.bulkUpdateNodes(merge(object{"uuids": vars["uuids"]}, object{"fields": vars["fields"]}))
			return vars["result"]
		}
	case "hosts_list":
		{
			vars["result"] = e.getHosts()
			return vars["result"]
		}
	case "hosts_get":
		{
			vars["uuid"] = get(args, "uuid")
			vars["result"] = e.getHostByUuid(vars["uuid"])
			return vars["result"]
		}
	case "hosts_tags_list":
		{
			vars["result"] = e.getHostTags()
			return vars["result"]
		}
	case "hosts_create":
		{
			vars["params"] = args
			vars["body"] = merge(object{"remark": get(vars["params"], "remark")}, object{"address": get(vars["params"], "address")}, object{"port": get(vars["params"], "port")}, object{"inbound": merge(object{"configProfileUuid": get(vars["params"], "configProfileUuid")}, object{"configProfileInboundUuid": get(vars["params"], "configProfileInboundUuid")})})
			if truth(!equal(get(vars["params"], "path"), undef)) {
				set(vars["body"], "path", get(vars["params"], "path"))
			}
			if truth(!equal(get(vars["params"], "sni"), undef)) {
				set(vars["body"], "sni", get(vars["params"], "sni"))
			}
			if truth(!equal(get(vars["params"], "host"), undef)) {
				set(vars["body"], "host", get(vars["params"], "host"))
			}
			if truth(!equal(get(vars["params"], "alpn"), undef)) {
				set(vars["body"], "alpn", get(vars["params"], "alpn"))
			}
			if truth(!equal(get(vars["params"], "fingerprint"), undef)) {
				set(vars["body"], "fingerprint", get(vars["params"], "fingerprint"))
			}
			if truth(!equal(get(vars["params"], "isDisabled"), undef)) {
				set(vars["body"], "isDisabled", get(vars["params"], "isDisabled"))
			}
			if truth(!equal(get(vars["params"], "isHidden"), undef)) {
				set(vars["body"], "isHidden", get(vars["params"], "isHidden"))
			}
			if truth(!equal(get(vars["params"], "securityLayer"), undef)) {
				set(vars["body"], "securityLayer", get(vars["params"], "securityLayer"))
			}
			if truth(!equal(get(vars["params"], "tags"), undef)) {
				set(vars["body"], "tags", get(vars["params"], "tags"))
			}
			if truth(!equal(get(vars["params"], "serverDescription"), undef)) {
				set(vars["body"], "serverDescription", get(vars["params"], "serverDescription"))
			}
			if truth(!equal(get(vars["params"], "nodes"), undef)) {
				set(vars["body"], "nodes", get(vars["params"], "nodes"))
			}
			if truth(!equal(get(vars["params"], "excludeFromSubscriptionTypes"), undef)) {
				set(vars["body"], "excludeFromSubscriptionTypes", get(vars["params"], "excludeFromSubscriptionTypes"))
			}
			if truth(!equal(get(vars["params"], "xrayJsonTemplateUuid"), undef)) {
				set(vars["body"], "xrayJsonTemplateUuid", get(vars["params"], "xrayJsonTemplateUuid"))
			}
			if truth(!equal(get(vars["params"], "excludedInternalSquads"), undef)) {
				set(vars["body"], "excludedInternalSquads", get(vars["params"], "excludedInternalSquads"))
			}
			if truth(!equal(get(vars["params"], "overrideSniFromAddress"), undef)) {
				set(vars["body"], "overrideSniFromAddress", get(vars["params"], "overrideSniFromAddress"))
			}
			if truth(!equal(get(vars["params"], "keepSniBlank"), undef)) {
				set(vars["body"], "keepSniBlank", get(vars["params"], "keepSniBlank"))
			}
			if truth(!equal(get(vars["params"], "vlessRouteId"), undef)) {
				set(vars["body"], "vlessRouteId", get(vars["params"], "vlessRouteId"))
			}
			if truth(!equal(get(vars["params"], "shuffleHost"), undef)) {
				set(vars["body"], "shuffleHost", get(vars["params"], "shuffleHost"))
			}
			if truth(!equal(get(vars["params"], "mihomoX25519"), undef)) {
				set(vars["body"], "mihomoX25519", get(vars["params"], "mihomoX25519"))
			}
			if truth(!equal(get(vars["params"], "mihomoIpVersion"), undef)) {
				set(vars["body"], "mihomoIpVersion", get(vars["params"], "mihomoIpVersion"))
			}
			if truth(!equal(get(vars["params"], "pinnedPeerCertSha256"), undef)) {
				set(vars["body"], "pinnedPeerCertSha256", get(vars["params"], "pinnedPeerCertSha256"))
			}
			if truth(!equal(get(vars["params"], "verifyPeerCertByName"), undef)) {
				set(vars["body"], "verifyPeerCertByName", get(vars["params"], "verifyPeerCertByName"))
			}
			vars["result"] = e.createHost(vars["body"])
			return vars["result"]
		}
	case "hosts_update":
		{
			vars["params"] = args
			vars["uuid"] = get(vars["params"], "uuid")
			vars["configProfileUuid"] = get(vars["params"], "configProfileUuid")
			vars["configProfileInboundUuid"] = get(vars["params"], "configProfileInboundUuid")
			vars["fields"] = without(vars["params"], "uuid", "configProfileUuid", "configProfileInboundUuid")
			vars["body"] = merge(object{"uuid": vars["uuid"]}, vars["fields"])
			if truth((truth(!equal(vars["configProfileUuid"], undef)) || truth(!equal(vars["configProfileInboundUuid"], undef)))) {
				set(vars["body"], "inbound", merge(choose(!equal(vars["configProfileUuid"], undef), merge(object{"configProfileUuid": vars["configProfileUuid"]}), merge()), choose(!equal(vars["configProfileInboundUuid"], undef), merge(object{"configProfileInboundUuid": vars["configProfileInboundUuid"]}), merge())))
			}
			vars["result"] = e.updateHost(vars["body"])
			return vars["result"]
		}
	case "hosts_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteHost(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Host " + str(vars["uuid"]) + " deleted")})
		}
	case "hosts_bulk_enable":
		{
			vars["params"] = args
			return e.bulkEnableHosts(vars["params"])
		}
	case "hosts_bulk_disable":
		{
			vars["params"] = args
			return e.bulkDisableHosts(vars["params"])
		}
	case "hosts_bulk_delete":
		{
			vars["params"] = args
			return e.bulkDeleteHosts(vars["params"])
		}
	case "hosts_bulk_set_inbound":
		{
			vars["params"] = args
			return e.bulkSetHostInbound(vars["params"])
		}
	case "hosts_bulk_set_port":
		{
			vars["params"] = args
			return e.bulkSetHostPort(vars["params"])
		}
	case "system_stats":
		{
			vars["result"] = e.getStats()
			return vars["result"]
		}
	case "system_bandwidth_stats":
		{
			vars["result"] = e.getBandwidthStats()
			return vars["result"]
		}
	case "system_nodes_metrics":
		{
			vars["result"] = e.getNodesMetrics()
			return vars["result"]
		}
	case "system_nodes_statistics":
		{
			vars["result"] = e.getNodesStatistics()
			return vars["result"]
		}
	case "system_health":
		{
			vars["result"] = e.getHealth()
			return vars["result"]
		}
	case "system_metadata":
		{
			vars["result"] = e.getSystemMetadata()
			return vars["result"]
		}
	case "system_generate_x25519":
		{
			vars["result"] = e.generateX25519()
			return vars["result"]
		}
	case "auth_status":
		{
			vars["result"] = e.getAuthStatus()
			return vars["result"]
		}
	case "system_stats_recap":
		{
			vars["result"] = e.getStatsRecap()
			return vars["result"]
		}
	case "system_stats_digest":
		{
			vars["start"] = get(args, "start")
			vars["end"] = get(args, "end")
			vars["result"] = e.getStatsDigest(merge(object{"start": vars["start"]}, object{"end": vars["end"]}))
			return vars["result"]
		}
	case "system_http_stats":
		{
			vars["result"] = e.getHttpStats()
			return vars["result"]
		}
	case "system_configuration":
		{
			vars["result"] = e.getConfiguration()
			return vars["result"]
		}
	case "system_srr_matcher":
		{
			vars["params"] = args
			vars["result"] = e.testSrrMatcher(vars["params"])
			return vars["result"]
		}
	case "subscriptions_list":
		{
			vars["start"] = get(args, "start")
			vars["size"] = get(args, "size")
			vars["result"] = e.getSubscriptions(vars["start"], vars["size"])
			return vars["result"]
		}
	case "subscriptions_get_by_user_id":
		{
			vars["userId"] = get(args, "userId")
			vars["result"] = e.getSubscriptionByUserId(vars["userId"])
			return vars["result"]
		}
	case "subscriptions_get_by_username":
		{
			vars["username"] = get(args, "username")
			vars["result"] = e.getSubscriptionByUsername(vars["username"])
			return vars["result"]
		}
	case "subscriptions_get_by_short_uuid":
		{
			vars["shortUuid"] = get(args, "shortUuid")
			vars["result"] = e.getSubscriptionByShortUuid(vars["shortUuid"])
			return vars["result"]
		}
	case "subscription_info":
		{
			vars["shortUuid"] = get(args, "shortUuid")
			vars["result"] = e.getSubscriptionInfo(vars["shortUuid"])
			return vars["result"]
		}
	case "subscriptions_get_raw_by_short_uuid":
		{
			vars["shortUuid"] = get(args, "shortUuid")
			return e.getSubscriptionByShortUuidRaw(vars["shortUuid"])
		}
	case "subscriptions_get_subpage_config":
		{
			vars["shortUuid"] = get(args, "shortUuid")
			return e.getSubscriptionSubpageConfig(vars["shortUuid"])
		}
	case "subscriptions_get_connection_keys":
		{
			vars["userId"] = get(args, "userId")
			return e.getConnectionKeysByUserId(vars["userId"])
		}
	case "subscription_request_history_list":
		{
			return e.getSubscriptionRequestHistory()
		}
	case "subscription_request_history_stats":
		{
			return e.getSubscriptionRequestHistoryStats()
		}
	case "config_profiles_list":
		{
			vars["result"] = e.getConfigProfiles()
			return vars["result"]
		}
	case "config_profiles_get":
		{
			vars["uuid"] = get(args, "uuid")
			vars["result"] = e.getConfigProfileByUuid(vars["uuid"])
			return vars["result"]
		}
	case "inbounds_list":
		{
			vars["result"] = e.getAllInbounds()
			return vars["result"]
		}
	case "config_profiles_get_inbounds":
		{
			vars["uuid"] = get(args, "uuid")
			vars["result"] = e.getInboundsByProfileUuid(vars["uuid"])
			return vars["result"]
		}
	case "config_profiles_get_computed_config":
		{
			vars["uuid"] = get(args, "uuid")
			vars["result"] = e.getComputedConfigByProfileUuid(vars["uuid"])
			return vars["result"]
		}
	case "config_profiles_create":
		{
			vars["params"] = args
			vars["result"] = e.createConfigProfile(vars["params"])
			return vars["result"]
		}
	case "config_profiles_update":
		{
			vars["params"] = args
			vars["result"] = e.updateConfigProfile(vars["params"])
			return vars["result"]
		}
	case "config_profiles_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteConfigProfile(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Profile " + str(vars["uuid"]) + " deleted")})
		}
	case "config_profiles_reorder":
		{
			vars["params"] = args
			vars["result"] = e.reorderConfigProfiles(vars["params"])
			return vars["result"]
		}
	case "squads_list":
		{
			vars["result"] = e.getInternalSquads()
			return vars["result"]
		}
	case "squads_accessible_nodes":
		{
			vars["uuid"] = get(args, "uuid")
			vars["result"] = e.getSquadAccessibleNodes(vars["uuid"])
			return vars["result"]
		}
	case "squads_create":
		{
			vars["params"] = args
			vars["result"] = e.createInternalSquad(vars["params"])
			return vars["result"]
		}
	case "squads_update":
		{
			vars["params"] = args
			vars["result"] = e.updateInternalSquad(vars["params"])
			return vars["result"]
		}
	case "squads_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteInternalSquad(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Squad " + str(vars["uuid"]) + " deleted")})
		}
	case "squads_add_users":
		{
			vars["squadUuid"] = get(args, "squadUuid")
			vars["userIds"] = get(args, "userIds")
			vars["result"] = e.addManyUsersToSquad(vars["squadUuid"], merge(object{"userIds": vars["userIds"]}))
			return vars["result"]
		}
	case "squads_remove_users":
		{
			vars["squadUuid"] = get(args, "squadUuid")
			vars["userIds"] = get(args, "userIds")
			vars["result"] = e.removeManyUsersFromSquad(vars["squadUuid"], merge(object{"userIds": vars["userIds"]}))
			return vars["result"]
		}
	case "squads_add_all_users":
		{
			vars["squadUuid"] = get(args, "squadUuid")
			vars["result"] = e.addAllUsersToSquad(vars["squadUuid"])
			return vars["result"]
		}
	case "squads_remove_all_users":
		{
			vars["squadUuid"] = get(args, "squadUuid")
			vars["result"] = e.removeAllUsersFromSquad(vars["squadUuid"])
			return vars["result"]
		}
	case "hwid_devices_list":
		{
			vars["userId"] = get(args, "userId")
			vars["result"] = e.getUserHwidDevices(vars["userId"])
			return vars["result"]
		}
	case "hwid_devices_list_all":
		{
			vars["result"] = e.getAllHwidDevices()
			return vars["result"]
		}
	case "hwid_stats":
		{
			vars["result"] = e.getHwidStats()
			return vars["result"]
		}
	case "hwid_top_users":
		{
			vars["result"] = e.getHwidTopUsers()
			return vars["result"]
		}
	case "hwid_device_create":
		{
			vars["params"] = args
			vars["result"] = e.createUserHwidDevice(vars["params"])
			return vars["result"]
		}
	case "hwid_device_delete":
		{
			vars["userId"] = get(args, "userId")
			vars["hwid"] = get(args, "hwid")
			vars["result"] = e.deleteHwidDevice(merge(object{"userId": vars["userId"]}, object{"hwid": vars["hwid"]}))
			return vars["result"]
		}
	case "hwid_devices_delete_all":
		{
			vars["userId"] = get(args, "userId")
			vars["result"] = e.deleteAllUserHwidDevices(merge(object{"userId": vars["userId"]}))
			return vars["result"]
		}
	case "api_tokens_list":
		{
			return e.getApiTokens()
		}
	case "api_tokens_create":
		{
			vars["params"] = args
			return e.createApiToken(vars["params"])
		}
	case "api_tokens_ott":
		{
			return e.getOtt()
		}
	case "api_tokens_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteApiToken(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Token " + str(vars["uuid"]) + " deleted")})
		}
	case "keygen_get":
		{
			return e.getKeygen()
		}
	case "billing_providers_list":
		{
			return e.getBillingProviders()
		}
	case "billing_provider_get":
		{
			vars["uuid"] = get(args, "uuid")
			return e.getBillingProviderByUuid(vars["uuid"])
		}
	case "billing_nodes_list":
		{
			return e.getBillingNodes()
		}
	case "billing_history_list":
		{
			return e.getBillingHistory()
		}
	case "billing_provider_create":
		{
			vars["params"] = args
			return e.createBillingProvider(vars["params"])
		}
	case "billing_provider_update":
		{
			vars["params"] = args
			return e.updateBillingProvider(vars["params"])
		}
	case "billing_provider_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteBillingProvider(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Provider " + str(vars["uuid"]) + " deleted")})
		}
	case "billing_node_create":
		{
			vars["params"] = args
			return e.createBillingNode(merge(object{"nodeUuid": coalesce(get(vars["params"], "nodeUuid"), nil)}, object{"providerUuid": get(vars["params"], "providerUuid")}, object{"name": coalesce(get(vars["params"], "name"), nil)}, object{"nextBillingAt": date(coalesce(get(vars["params"], "nextBillingAt"), nowMillis()))}))
		}
	case "billing_node_update":
		{
			vars["params"] = args
			return e.updateBillingNode(merge(object{"uuids": get(vars["params"], "uuids")}, object{"nextBillingAt": date(get(vars["params"], "nextBillingAt"))}))
		}
	case "billing_node_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteBillingNode(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Billing node " + str(vars["uuid"]) + " deleted")})
		}
	case "billing_history_create":
		{
			vars["params"] = args
			return e.createBillingHistory(merge(object{"providerUuid": get(vars["params"], "providerUuid")}, object{"amount": get(vars["params"], "amount")}, object{"billedAt": date(get(vars["params"], "billedAt"))}))
		}
	case "billing_history_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteBillingHistory(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("History entry " + str(vars["uuid"]) + " deleted")})
		}
	case "snippets_list":
		{
			return e.getSnippets()
		}
	case "snippets_create":
		{
			vars["params"] = args
			return e.createSnippet(vars["params"])
		}
	case "snippets_update":
		{
			vars["params"] = args
			return e.updateSnippet(vars["params"])
		}
	case "snippets_sync":
		{
			vars["params"] = args
			return e.syncSnippet(vars["params"])
		}
	case "snippets_delete":
		{
			vars["params"] = args
			return e.deleteSnippet(vars["params"])
		}
	case "external_squads_list":
		{
			return e.getExternalSquads()
		}
	case "external_squads_get":
		{
			vars["uuid"] = get(args, "uuid")
			return e.getExternalSquadByUuid(vars["uuid"])
		}
	case "external_squads_create":
		{
			vars["params"] = args
			return e.createExternalSquad(vars["params"])
		}
	case "external_squads_update":
		{
			vars["params"] = args
			return e.updateExternalSquad(vars["params"])
		}
	case "external_squads_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteExternalSquad(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Squad " + str(vars["uuid"]) + " deleted")})
		}
	case "external_squads_add_all_users":
		{
			vars["squadUuid"] = get(args, "squadUuid")
			return e.addAllUsersToExternalSquad(vars["squadUuid"])
		}
	case "external_squads_remove_all_users":
		{
			vars["squadUuid"] = get(args, "squadUuid")
			return e.removeAllUsersFromExternalSquad(vars["squadUuid"])
		}
	case "external_squads_reorder":
		{
			vars["params"] = args
			return e.reorderExternalSquads(vars["params"])
		}
	case "settings_get":
		{
			return e.getSettings()
		}
	case "settings_update":
		{
			vars["settings"] = get(args, "settings")
			return e.updateSettings(vars["settings"])
		}
	case "sub_page_configs_list":
		{
			return e.getSubscriptionPageConfigs()
		}
	case "sub_page_configs_get":
		{
			vars["uuid"] = get(args, "uuid")
			return e.getSubscriptionPageConfig(vars["uuid"])
		}
	case "sub_page_configs_create":
		{
			vars["params"] = args
			return e.createSubscriptionPageConfig(vars["params"])
		}
	case "sub_page_configs_update":
		{
			vars["params"] = args
			return e.updateSubscriptionPageConfig(vars["params"])
		}
	case "sub_page_configs_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteSubscriptionPageConfig(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Config " + str(vars["uuid"]) + " deleted")})
		}
	case "sub_page_configs_reorder":
		{
			vars["params"] = args
			return e.reorderSubscriptionPageConfigs(vars["params"])
		}
	case "sub_page_configs_clone":
		{
			vars["params"] = args
			return e.cloneSubscriptionPageConfig(vars["params"])
		}
	case "node_plugins_list":
		{
			return e.getNodePlugins()
		}
	case "node_plugins_get":
		{
			vars["uuid"] = get(args, "uuid")
			return e.getNodePlugin(vars["uuid"])
		}
	case "node_plugins_shared_lists_list":
		{
			return e.getSharedLists()
		}
	case "node_plugins_shared_lists_get":
		{
			vars["uuid"] = get(args, "uuid")
			return e.getSharedList(vars["uuid"])
		}
	case "node_plugins_torrent_reports":
		{
			return e.getTorrentBlockerReports()
		}
	case "node_plugins_torrent_stats":
		{
			return e.getTorrentBlockerStats()
		}
	case "node_plugins_create":
		{
			vars["params"] = args
			return e.createNodePlugin(vars["params"])
		}
	case "node_plugins_update":
		{
			vars["params"] = args
			return e.updateNodePlugin(vars["params"])
		}
	case "node_plugins_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteNodePlugin(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Plugin " + str(vars["uuid"]) + " deleted")})
		}
	case "node_plugins_reorder":
		{
			vars["params"] = args
			return e.reorderNodePlugins(vars["params"])
		}
	case "node_plugins_clone":
		{
			vars["params"] = args
			return e.cloneNodePlugin(vars["params"])
		}
	case "node_plugins_execute":
		{
			vars["params"] = args
			return e.executeNodePlugin(vars["params"])
		}
	case "node_plugins_sync":
		{
			vars["params"] = args
			return e.syncNodePlugin(vars["params"])
		}
	case "node_plugins_shared_lists_create":
		{
			vars["params"] = args
			return e.createSharedList(vars["params"])
		}
	case "node_plugins_shared_lists_update":
		{
			vars["params"] = args
			return e.updateSharedList(vars["params"])
		}
	case "node_plugins_shared_lists_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteSharedList(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Shared list " + str(vars["uuid"]) + " deleted")})
		}
	case "node_plugins_shared_lists_sync":
		{
			vars["params"] = args
			return e.syncSharedList(vars["params"])
		}
	case "node_plugins_torrent_truncate":
		{
			return e.truncateTorrentBlockerReports()
		}
	case "connections_by_user":
		{
			vars["userId"] = get(args, "userId")
			return e.connectionsByUser(vars["userId"])
		}
	case "connections_by_user_result":
		{
			vars["jobId"] = get(args, "jobId")
			return e.connectionsByUserResult(vars["jobId"])
		}
	case "connections_by_node":
		{
			vars["nodeUuid"] = get(args, "nodeUuid")
			return e.connectionsByNode(vars["nodeUuid"])
		}
	case "connections_by_node_result":
		{
			vars["jobId"] = get(args, "jobId")
			return e.connectionsByNodeResult(vars["jobId"])
		}
	case "connections_geocheck_by_node":
		{
			vars["nodeUuid"] = get(args, "nodeUuid")
			return e.geocheckByNode(vars["nodeUuid"])
		}
	case "connections_geocheck_by_node_result":
		{
			vars["jobId"] = get(args, "jobId")
			return e.geocheckByNodeResult(vars["jobId"])
		}
	case "connections_drop":
		{
			vars["params"] = args
			return e.dropConnections(vars["params"])
		}
	case "bandwidth_nodes_list":
		{
			vars["start"] = get(args, "start")
			vars["end"] = get(args, "end")
			return e.getNodesBandwidth(merge(object{"start": vars["start"]}, object{"end": vars["end"]}))
		}
	case "bandwidth_nodes_realtime":
		{
			return e.getNodesRealtimeBandwidth()
		}
	case "bandwidth_user_usage":
		{
			vars["userId"] = get(args, "userId")
			vars["start"] = get(args, "start")
			vars["end"] = get(args, "end")
			return e.getUserBandwidthByUserId(vars["userId"], merge(object{"start": vars["start"]}, object{"end": vars["end"]}))
		}
	case "bandwidth_nodes_usage":
		{
			vars["nodesUuids"] = get(args, "nodesUuids")
			vars["start"] = get(args, "start")
			vars["end"] = get(args, "end")
			vars["minTotalBytes"] = get(args, "minTotalBytes")
			return e.getNodesUsage(merge(object{"nodesUuids": vars["nodesUuids"]}), merge(object{"start": vars["start"]}, object{"end": vars["end"]}, object{"minTotalBytes": vars["minTotalBytes"]}))
		}
	case "bandwidth_squad_usage":
		{
			vars["squadUuid"] = get(args, "squadUuid")
			vars["query"] = without(args, "squadUuid")
			return e.getInternalSquadUsage(vars["squadUuid"], vars["query"])
		}
	case "bandwidth_squad_user_usage":
		{
			vars["squadUuid"] = get(args, "squadUuid")
			vars["userId"] = get(args, "userId")
			vars["start"] = get(args, "start")
			vars["end"] = get(args, "end")
			return e.getInternalSquadUserUsage(vars["squadUuid"], vars["userId"], merge(object{"start": vars["start"]}, object{"end": vars["end"]}))
		}
	case "node_integrations_list":
		{
			return e.getNodeIntegrations()
		}
	case "node_integrations_get":
		{
			vars["uuid"] = get(args, "uuid")
			return e.getNodeIntegration(vars["uuid"])
		}
	case "node_integrations_create":
		{
			vars["params"] = args
			return e.createNodeIntegration(vars["params"])
		}
	case "node_integrations_update":
		{
			vars["params"] = args
			return e.updateNodeIntegration(vars["params"])
		}
	case "node_integrations_delete":
		{
			vars["uuid"] = get(args, "uuid")
			_ = e.deleteNodeIntegration(vars["uuid"])
			return merge(object{"success": true}, object{"message": ("Integration " + str(vars["uuid"]) + " deleted")})
		}
	case "metadata_node_get":
		{
			vars["uuid"] = get(args, "uuid")
			return e.getNodeMetadata(vars["uuid"])
		}
	case "metadata_user_get":
		{
			vars["userId"] = get(args, "userId")
			return e.getUserMetadata(vars["userId"])
		}
	case "metadata_node_upsert":
		{
			vars["uuid"] = get(args, "uuid")
			vars["metadata"] = get(args, "metadata")
			return e.upsertNodeMetadata(vars["uuid"], vars["metadata"])
		}
	case "metadata_user_upsert":
		{
			vars["userId"] = get(args, "userId")
			vars["metadata"] = get(args, "metadata")
			return e.upsertUserMetadata(vars["userId"], vars["metadata"])
		}
	}
	return nil
}
