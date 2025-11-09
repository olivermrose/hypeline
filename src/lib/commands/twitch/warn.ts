import { ApiError, CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, getTarget } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "warn",
	description:
		"Issue a warning to a user that they must acknowledge before sending more messages",
	modOnly: true,
	args: ["username", "reason"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);
		const reason = args.slice(1).join(" ");

		if (!reason) {
			throw new CommandError(ErrorMessage.MISSING_ARG(this.args[1]));
		}

		try {
			await target.warn(reason);
		} catch (error) {
			if (error instanceof ApiError && error.message.includes("may not be warned")) {
				throw new CommandError(ErrorMessage.USER_CANNOT_BE_WARNED(target.displayName));
			} else {
				throw error;
			}
		}
	},
});
