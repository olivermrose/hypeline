import { CommandError } from "$lib/errors/command-error";
import { ErrorMessage } from "$lib/errors/messages";
import { defineCommand, parseBool } from "../util";

export default defineCommand({
	provider: "Built-in",
	name: "refresh-badges",
	description: "Refresh all badges for the channel and optionally global badges",
	args: ["include-global"],
	async exec(args, channel) {
		const includeGlobal = parseBool(args[0]);

		if (includeGlobal === null) {
			throw new CommandError(ErrorMessage.INVALID_BOOL_ARG);
		}

		await channel.client.fetchBadges(includeGlobal);
		await channel.fetchBadges(true);

		channel.chat.addSystemMessage("Refreshed badges.");
	},
});
