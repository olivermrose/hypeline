import { defineCommand } from "../util";

export default defineCommand({
	provider: "Built-in",
	name: "refresh-badges",
	description: "Refresh all badges for the channel",
	async exec(_, channel) {
		await channel.fetchBadges(true);
	},
});
