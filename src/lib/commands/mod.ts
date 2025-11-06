import { ApiError, CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, getTarget } from "./util";

export default defineCommand({
	name: "mod",
	description: "Grant moderator status to a user",
	broadcasterOnly: true,
	args: ["username"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);

		try {
			await channel.viewers.mod(target.id);
		} catch (error) {
			if (error instanceof ApiError) {
				if (error.status === 400) {
					if (error.message.includes("already")) {
						throw new CommandError(ErrorMessage.USER_ALREADY_MOD(target.displayName));
					} else if (error.message.includes("banned")) {
						throw new CommandError(
							ErrorMessage.BANNED_USER_CANNOT_BE_MOD(target.displayName),
						);
					}
				} else if (error.status === 422) {
					throw new CommandError(ErrorMessage.VIP_CANNOT_BE_MOD(target.displayName));
				} else {
					throw error;
				}
			} else {
				throw error;
			}
		}
	},
});
