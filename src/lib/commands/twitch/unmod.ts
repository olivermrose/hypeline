import { ApiError } from "$lib/errors/api-error";
import { CommandError } from "$lib/errors/command-error";
import { ErrorMessage } from "$lib/errors/messages";
import { defineCommand, getTarget } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "unmod",
	description: "Revoke moderator status from a user",
	broadcasterOnly: true,
	args: ["username"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);

		try {
			await channel.viewers.unmod(target.id);
		} catch (error) {
			if (error instanceof ApiError && error.status === 422) {
				throw new CommandError(ErrorMessage.USER_NOT_MOD(target.displayName));
			} else {
				throw error;
			}
		}
	},
});
