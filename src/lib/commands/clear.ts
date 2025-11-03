import { defineCommand } from "./util";

export default defineCommand({
	name: "clear",
	description: "Clear chat history for non-moderator viewers",
	modOnly: true,
	async exec(_, channel) {
		await channel.clearChat();
	},
});
