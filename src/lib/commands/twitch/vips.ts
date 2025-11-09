import { twitchGql as gql } from "$lib/graphql";
import { SystemMessage } from "$lib/models";
import { defineCommand } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "vips",
	description: "Display a list of VIPs for this channel",
	async exec(_, channel) {
		const { user } = await channel.client.send(
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

		for (const edge of user?.vips?.edges ?? []) {
			if (edge.node) {
				vips.push(edge.node.displayName);
			}
		}

		const list = vips.sort().join(", ");

		channel.addMessage(new SystemMessage(`Channel VIPs (${vips.length}): ${list}`));
	},
});
