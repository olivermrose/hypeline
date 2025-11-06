import { ApiError, CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, getTarget, parseDuration } from "./util";

export default defineCommand({
	name: "timeout",
	description: "Temporarily restrict a user from sending messages",
	modOnly: true,
	args: ["username", "duration", "reason"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);
		const duration = parseDuration(args[1]) ?? 600;

		if (duration < 0 || duration > 1_209_600) {
			throw new CommandError(ErrorMessage.INVALID_TIMEOUT_DURATION);
		}

		try {
			await target.timeout({ duration, reason: args.slice(2).join(" ") });
		} catch (error) {
			if (error instanceof ApiError && error.message.includes("may not be banned")) {
				throw new CommandError(ErrorMessage.USER_CANNOT_BE_TIMED_OUT(target.displayName));
			} else {
				throw error;
			}
		}
	},
});
