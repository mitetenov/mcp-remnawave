package remnawave

func promptResult(name string, args object) any {
	vars := object{}
	_ = vars
	switch name {
	case "create_user_wizard":
		{
			vars["username"] = get(args, "username")
			return merge(object{"messages": []any{merge(object{"role": "user"}, object{"content": merge(object{"type": "text"}, object{"text": ("I want to create a new VPN user with username \"" + str(vars["username"]) + "\". Please guide me through the process:\n\n1. First, check if the username is already taken using users_get_by_username\n2. Get the list of available config profiles using config_profiles_list\n3. Get the list of available internal squads using squads_list\n4. Create the user with appropriate settings (ask me about traffic limit, expiration date, and which squads to assign)\n5. Confirm the user was created successfully and show the subscription URL")})})}})
		}
	case "node_diagnostics":
		{
			vars["nodeUuid"] = get(args, "nodeUuid")
			return merge(object{"messages": []any{merge(object{"role": "user"}, object{"content": merge(object{"type": "text"}, object{"text": ("Please run diagnostics on node " + str(vars["nodeUuid"]) + ":\n\n1. Get node details using nodes_get\n2. Check system health using system_health\n3. Get node metrics using system_nodes_metrics\n4. Check bandwidth stats using system_bandwidth_stats\n5. Summarize the node's status: connection state, xray version, uptime, traffic usage, online users\n6. Flag any issues found (offline, high traffic usage, errors)")})})}})
		}
	case "traffic_report":
		{
			vars["startDate"] = get(args, "startDate")
			vars["endDate"] = get(args, "endDate")
			vars["period"] = choose((truth(vars["startDate"]) && truth(vars["endDate"])), ("from " + str(vars["startDate"]) + " to " + str(vars["endDate"]) + ""), "current")
			return merge(object{"messages": []any{merge(object{"role": "user"}, object{"content": merge(object{"type": "text"}, object{"text": ("Generate a traffic report for the " + str(vars["period"]) + " period:\n\n1. Get overall system stats using system_stats\n2. Get bandwidth statistics using system_bandwidth_stats\n3. Get node statistics using system_nodes_statistics\n4. List all users and their traffic using users_list\n5. Provide a summary including:\n   - Total traffic consumed\n   - Per-node traffic breakdown\n   - Top users by traffic consumption\n   - Users who exceeded their traffic limits\n   - Users with expired subscriptions")})})}})
		}
	case "user_audit":
		{
			vars["userId"] = get(args, "userId")
			return merge(object{"messages": []any{merge(object{"role": "user"}, object{"content": merge(object{"type": "text"}, object{"text": ("Perform a complete audit of user " + str(vars["userId"]) + ":\n\n1. Get full user details using users_get\n2. Get subscription info using subscriptions_get_by_user_id\n3. Get HWID devices using hwid_devices_list\n4. Summarize:\n   - Account status and expiration\n   - Traffic usage vs limit\n   - Subscription URL and last access\n   - Connected devices (HWID)\n   - Squad memberships\n   - Any issues or concerns")})})}})
		}
	case "bulk_user_cleanup":
		{
			return merge(object{"messages": []any{merge(object{"role": "user"}, object{"content": merge(object{"type": "text"}, object{"text": "Help me clean up users:\n\n1. List all users using users_list with a large page size\n2. Identify:\n   - Users with EXPIRED status\n   - Users with DISABLED status\n   - Users with LIMITED status (exceeded traffic)\n   - Users who haven't connected recently\n3. Present the findings in a clear table\n4. Ask what action to take (disable, delete, extend, reset traffic)\n5. Execute the chosen action after confirmation"})})}})
		}
	}
	return nil
}
