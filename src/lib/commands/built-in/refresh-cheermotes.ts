import { defineCommand } from "../util";

export default defineCommand({
	provider: "Built-in",
	name: "refresh-cheermotes",
	description: "Refresh cheermotes for the channel",
	async exec(_, channel) {
		await channel.fetchCheermotes(true);
	},
});
