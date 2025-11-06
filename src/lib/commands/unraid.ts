import { ApiError, CommandError, ErrorMessage } from "$lib/errors";
import { defineCommand } from "./util";

export default defineCommand({
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
