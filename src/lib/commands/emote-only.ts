import { defineCommand, parseBool } from "./util";

export default defineCommand({
	name: "emote-only",
	description: "Restrict chat to emote only messages",
	modOnly: true,
	args: ["enabled"],
	async exec(args, channel) {
		const enabled = parseBool(args[0]);

		if (enabled === null) {
			channel.error = "Invalid value. Use 'on/off' or 'true/false'.";
			return;
		}

		await channel.updateChatSettings({ emoteOnly: enabled });
	},
});
