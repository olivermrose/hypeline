import { goto } from "$app/navigation";
import { app } from "$lib/app.svelte";
import { ApiError, CommandError, ErrorMessage } from "$lib/errors";
import { Channel } from "$lib/models";
import { defineCommand } from "../";

export default defineCommand({
	provider: "Built-in",
	name: "join",
	description: "Join a channel",
	args: ["channel"],
	async exec(args) {
		if (!args[0]) {
			throw new CommandError(ErrorMessage.MISSING_ARG(this.args[0]));
		}

		let channel = app.channels.find((c) => c.user.username === args[0]);

		if (!channel) {
			try {
				const user = await app.twitch.users.fetch(args[0], { by: "login" });

				channel = new Channel(app.twitch, user);
				channel.ephemeral = true;

				app.channels.push(channel);
			} catch (error) {
				if (error instanceof ApiError && error.status === 404) {
					throw new CommandError(ErrorMessage.USER_NOT_FOUND(args[0]));
				} else {
					throw error;
				}
			}
		}

		await goto(`/channels/${args[0]}`);
	},
});
