import { CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, parseBool } from "./util";

export default defineCommand({
	name: "unique",
	description: "Prevent users from sending duplicate messages",
	modOnly: true,
	args: ["unique"],
	async exec(args, channel) {
		const enabled = parseBool(args[0]);

		if (enabled === null) {
			throw new CommandError(ErrorMessage.INVALID_BOOL_ARG);
		}

		await channel.updateChatSettings({ unique: enabled });
	},
});
