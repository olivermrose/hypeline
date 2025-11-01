import { defineCommand, getTarget } from "./util";

export default defineCommand({
	name: "unban",
	description: "Remove a permanent ban on a user",
	modOnly: true,
	args: ["username"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);
		if (!target) return;

		try {
			await channel.viewers.unban(target.id);
		} catch (error) {
			if (typeof error !== "string") return;

			if (error.includes("not banned")) {
				channel.error = `${target.displayName} is not banned.`;
			} else {
				throw error;
			}
		}
	},
});
