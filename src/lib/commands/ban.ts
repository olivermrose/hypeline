import { defineCommand, getTarget } from "./util";

export default defineCommand({
	name: "ban",
	description: "Permanently ban a user from chat",
	modOnly: true,
	args: ["username", "reason"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);
		if (!target) return;

		try {
			await target.ban(args.slice(1).join(" "));
		} catch (error) {
			if (typeof error !== "string") return;

			if (error.includes("already banned")) {
				channel.error = `${target.displayName} is already banned.`;
			} else if (error.includes("may not be banned")) {
				channel.error = `${target.displayName} may not be banned.`;
			} else {
				throw error;
			}
		}
	},
});
