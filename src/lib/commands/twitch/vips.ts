import { twitchGql as gql } from "$lib/graphql/function";
import { SystemMessage } from "$lib/models/message/system-message";
import { defineCommand } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "vips",
	description: "Display a list of VIPs for this channel",
	async exec(_, channel) {
		const message = new SystemMessage();

		const { user } = await channel.client.send(
			gql(`query GetVIPs($id: ID!) {
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

		const vips =
			user?.vips?.edges
				?.flatMap((edge) => (edge.node ? [edge.node.displayName] : []))
				.sort() ?? [];

		if (!vips.length) {
			message.text = "This channel has no VIPs.";
		} else {
			message.text = `Channel VIPs (${vips.length}): ${vips.join(", ")}`;
		}

		channel.chat.addMessage(message);
	},
});
