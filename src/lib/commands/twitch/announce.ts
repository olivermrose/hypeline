import { CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "announce",
	description: "Call attention to your message with a colored highlight",
	modOnly: true,
	args: ["message"],
	async exec(args, channel) {
		const message = args.join(" ");

		if (!message) {
			throw new CommandError(ErrorMessage.MISSING_ARG(this.args[0]));
		}

		await channel.announce(message);
	},
});
