import { app } from "$lib/app.svelte";
import { SystemMessage } from "$lib/models/message/system-message";
import { defineCommand, getTarget } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "block",
	description: "Block a user from interacting with you on Twitch",
	args: ["username"],
	async exec(args, channel) {
		const target = await getTarget(args[0], channel);
		if (!target) return;

		await app.twitch.users.block(target.id);

		const message = SystemMessage.fromContext({
			type: "blockStatus",
			blocked: true,
			user: target.user,
		});

		channel.chat.addMessage(message);
	},
});
