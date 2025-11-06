import { ApiError, CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, getTarget } from "./util";

export default defineCommand({
	name: "raid",
	description: "Send viewers to another channel when the stream ends",
	modOnly: true,
	args: ["channel"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);

		if (channel.user.id === target.id) {
			throw new CommandError(ErrorMessage.CANNOT_TARGET_SELF);
		}

		try {
			await channel.raid(target.id);
		} catch (error) {
			if (error instanceof ApiError && error.status === 400) {
				if (error.message.includes("settings do not")) {
					throw new CommandError(
						ErrorMessage.SETTINGS_DO_NOT_ALLOW_RAIDS(target.displayName),
					);
				} else if (error.message.includes("cannot be")) {
					throw new CommandError(ErrorMessage.USER_CANNOT_BE_RAIDED(target.displayName));
				}
			} else {
				throw error;
			}
		}
	},
});
