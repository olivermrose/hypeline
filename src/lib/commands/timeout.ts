import { defineCommand, getTarget, parseDuration } from "./util";

export default defineCommand({
	name: "timeout",
	description: "Temporarily restrict a user from sending messages",
	modOnly: true,
	args: ["username", "duration", "reason"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);
		if (!target) return;

		const duration = parseDuration(args[1]) ?? 600;

		if (duration < 0 || duration > 1_209_600) {
			channel.error = "Duration must be between 0 and 1,209,600 seconds (14 days).";
			return;
		}

		try {
			await target.timeout({ duration, reason: args.slice(2).join(" ") });
		} catch (error) {
			if (typeof error !== "string") return;

			if (error.includes("may not be banned")) {
				channel.error = `${target.username} may not be timed out.`;
			} else {
				throw error;
			}
		}
	},
});
