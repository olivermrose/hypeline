import { twitchGql as gql } from "$lib/graphql/function";
import { SystemMessage } from "$lib/models/message/system-message";
import { defineCommand } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "mods",
	description: "Display a list of moderators for this channel",
	async exec(_, channel) {
		const message = new SystemMessage();

		const { user } = await channel.client.send(
			gql(`query GetMods($id: ID!) {
				user(id: $id) {
					mods(first: 100) {
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

		const mods =
			user?.mods?.edges
				.flatMap((edge) => (edge.node ? [edge.node.displayName] : []))
				.sort() ?? [];

		if (!mods.length) {
			message.text = "This channel has no moderators.";
		} else {
			message.text = `Channel moderators (${mods.length}): ${mods.join(", ")}`;
		}

		channel.chat.addMessage(message);
	},
});
