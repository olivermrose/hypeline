import { ApiError, CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, getTarget } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "unban",
	description: "Remove a permanent ban on a user",
	modOnly: true,
	args: ["username"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);

		try {
			await channel.viewers.unban(target.id);
		} catch (error) {
			if (error instanceof ApiError && error.status === 400) {
				throw new CommandError(ErrorMessage.USER_NOT_BANNED(target.displayName));
			} else {
				throw error;
			}
		}
	},
});
