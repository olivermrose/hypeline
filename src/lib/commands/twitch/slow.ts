import { CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand, parseDuration } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "slow",
	description: "Limit how frequently users can send messages",
	modOnly: true,
	args: ["duration"],
	async exec(args, channel) {
		const duration = parseDuration(args[0]) ?? 30;

		if (duration !== 0 && (duration < 3 || duration > 120)) {
			throw new CommandError(ErrorMessage.INVALID_SLOW_DURATION);
		}

		await channel.updateChatSettings({ slow: duration });
	},
});
