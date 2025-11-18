import { ApiError } from "$lib/errors/api-error";
import { CommandError } from "$lib/errors/command-error";
import { ErrorMessage } from "$lib/errors/messages";
import { defineCommand, getTarget } from "../util";

export default defineCommand({
	provider: "Twitch",
	name: "unvip",
	description: "Revoke VIP status from a user",
	broadcasterOnly: true,
	args: ["username"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);

		try {
			await channel.viewers.unvip(target.id);
		} catch (error) {
			if (error instanceof ApiError && error.status === 422) {
				throw new CommandError(ErrorMessage.USER_NOT_VIP(target.displayName));
			} else {
				throw error;
			}
		}
	},
});
