import { CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, parseBool } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "shield",
	description: "Restrict chat and ban harassing chatters",
	modOnly: true,
	args: ["enabled"],
	async exec(args, channel) {
		const enabled = parseBool(args[0]);

		if (enabled === null) {
			throw new CommandError(ErrorMessage.INVALID_BOOL_ARG);
		}

		await channel.setShieldMode(enabled);
	},
});
