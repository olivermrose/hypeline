import { twitchGql as gql } from "$lib/graphql/function";
import { SystemMessage } from "$lib/models/message/system-message";
import { defineCommand } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "mods",
	description: "Display a list of moderators for this channel",
	async exec(_, channel) {
		const { user } = await channel.client.send(
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

		const mods: string[] = [];

		for (const edge of user?.mods?.edges ?? []) {
			mods.push(edge.node.displayName);
		}

		const list = mods.sort().join(", ");

		channel.chat.addMessage(new SystemMessage(`Channel moderators (${mods.length}): ${list}`));
	},
});
