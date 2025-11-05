import { defineCommand, parseBool } from "./util";

export default defineCommand({
	name: "unique",
	description: "Prevent users from sending duplicate messages",
	modOnly: true,
	args: ["unique"],
	async exec(args, channel) {
		const enabled = parseBool(args[0]);

		if (enabled === null) {
			channel.error = "Invalid value. Use 'on/off' or 'true/false'.";
			return;
		}

		await channel.updateChatSettings({ unique: enabled });
	},
});
