import { defineCommand, getTarget } from "./util";

export default defineCommand({
	name: "unvip",
	description: "Revoke VIP status from a user",
	broadcasterOnly: true,
	args: ["username"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);
		if (!target) return;

		try {
			await channel.viewers.unvip(target.id);
		} catch (error) {
			if (typeof error !== "string") return;

			if (error.includes("is not")) {
				channel.error = `${target.displayName} is not a VIP.`;
			} else {
				throw error;
			}
		}
	},
});
