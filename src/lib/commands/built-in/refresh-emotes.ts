import { defineCommand } from "../";

export default defineCommand({
	provider: "Built-in",
	name: "refresh-emotes",
	description: "Refresh all emotes for the channel",
	async exec(_, channel) {
		channel.emotes.clear();

		await channel.emotes.fetch();
	},
});
