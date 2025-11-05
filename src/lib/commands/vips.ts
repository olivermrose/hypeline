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
								displayName
							}
						}
					}
				}
			}`),
			{ id: channel.id },
		);

		const vips: string[] = [];

		for (const edge of data.user?.vips?.edges ?? []) {
			if (edge.node) {
				vips.push(edge.node.displayName);
			}
		}

		const list = vips.sort().join(", ");

		channel.addMessage(new SystemMessage(`Channel VIPs (${vips.length}): ${list}`));
	},
});
