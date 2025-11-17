import { app } from "$lib/app.svelte";
import { SystemMessage } from "$lib/models/message/system-message";
import { defineCommand, getTarget } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "unblock",
	description: "Remove a user from your block list",
	args: ["username"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);

		await app.twitch.users.unblock(target.id);

		const message = SystemMessage.fromContext({
			type: "blockStatus",
			blocked: false,
			user: target.user,
		});

		channel.chat.addMessage(message);
	},
});
