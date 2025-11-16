import { ApiError } from "$lib/errors/api-error";
import { CommandError } from "$lib/errors/command-error";
import { ErrorMessage } from "$lib/errors/messages";
import { defineCommand } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "unraid",
	description: "Stop an ongoing raid",
	modOnly: true,
	async exec(_, channel) {
		try {
			await channel.unraid();
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				throw new CommandError(ErrorMessage.NO_PENDING_RAID);
			} else {
				throw error;
			}
		}
	},
});
