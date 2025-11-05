import { SystemMessage } from "$lib/message";
import { gql } from "$lib/twitch/gql";
import { defineCommand } from "./util";

export default defineCommand({
	name: "mods",
	description: "Display a list of moderators for this channel",
	async exec(_, channel) {
		const { data } = await channel.client.send(
			gql(`query GetUserMods($id: ID!) {
				user(id: $id) {
					mods(first: 100) {
						edges {
							node {
								id
								displayName
							}
						}
					}
				}
			}`),
			{ id: channel.id },
		);

		for (const edge of data.user?.mods?.edges ?? []) {
			channel.moderators.set(edge.node.id, edge.node.displayName);
		}

		const list = channel.moderators.values().toArray().sort().join(", ");

		channel.addMessage(
			new SystemMessage(`Channel moderators (${channel.moderators.size}): ${list}`),
		);
	},
});
