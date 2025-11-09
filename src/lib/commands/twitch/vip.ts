import { ApiError, CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, getTarget } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "vip",
	description: "Grant VIP status to a user",
	broadcasterOnly: true,
	args: ["username"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);

		try {
			await channel.viewers.vip(target.id);
		} catch (error) {
			if (error instanceof ApiError) {
				if (error.status === 409) {
					throw new CommandError(ErrorMessage.NO_VIP_SLOTS);
				} else if (error.status === 422) {
					if (error.message.includes("already")) {
						throw new CommandError(ErrorMessage.USER_ALREADY_VIP(target.displayName));
					} else if (error.message.includes("moderator")) {
						throw new CommandError(ErrorMessage.MOD_CANNOT_BE_VIP(target.displayName));
					}
				} else {
					throw error;
				}
			} else {
				throw error;
			}
		}
	},
});
