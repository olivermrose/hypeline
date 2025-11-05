import { defineCommand } from "./util";

export default defineCommand({
	name: "announce",
	description: "Call attention to your message with a colored highlight",
	modOnly: true,
	args: ["message"],
	async exec(args, channel) {
		const message = args.join(" ");

		if (!message) {
			channel.error = "Missing message argument.";
			return;
		}

		await channel.announce(message);
	},
});
