import { SystemMessage } from "$lib/message";
import { gql } from "$lib/twitch/gql";
import { defineCommand } from "./util";

export default defineCommand({
	name: "vips",
	description: "Display a list of VIPs for this channel",
	async exec(_, channel) {
		const { data } = await channel.client.send(
			gql(`query GetUserVIPs($id: ID!) {
				user(id: $id) {
					vips(first: 100) {
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

		for (const edge of data.user?.vips?.edges ?? []) {
			if (edge.node) {
				channel.vips.set(edge.node.id, edge.node.displayName);
			}
		}

		const list = channel.vips.values().toArray().sort().join(", ");

		channel.addMessage(new SystemMessage(`Channel VIPs (${channel.vips.size}): ${list}`));
	},
});
