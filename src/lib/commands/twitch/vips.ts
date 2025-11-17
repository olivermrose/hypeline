import { twitchGql as gql } from "$lib/graphql/function";
import { SystemMessage } from "$lib/models/message/system-message";
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

		channel.chat.addMessage(new SystemMessage(`Channel VIPs (${vips.length}): ${list}`));
	},
});
