import { CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, parseBool } from "./util";

export default defineCommand({
	name: "subscriber-only",
	description: "Restrict chat to subscribers only",
	modOnly: true,
	args: ["enabled"],
	async exec(args, channel) {
		const enabled = parseBool(args[0]);

		if (enabled === null) {
			throw new CommandError(ErrorMessage.INVALID_BOOL_ARG);
		}

		await channel.updateChatSettings({ subOnly: enabled });
	},
});
