import { ApiError, CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, getTarget } from "./util";

export default defineCommand({
	name: "ban",
	description: "Permanently ban a user from chat",
	modOnly: true,
	args: ["username", "reason"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);

		try {
			await target.ban(args.slice(1).join(" "));
		} catch (error) {
			if (error instanceof ApiError && error.status === 400) {
				if (error.message.includes("already banned")) {
					throw new CommandError(ErrorMessage.USER_ALREADY_BANNED(target.displayName));
				} else if (error.message.includes("may not be banned")) {
					throw new CommandError(ErrorMessage.USER_CANNOT_BE_BANNED(target.displayName));
				}
			} else {
				throw error;
			}
		}
	},
});
