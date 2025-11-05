import { SystemMessage } from "$lib/message";
import { app } from "$lib/state.svelte";
import { defineCommand, getTarget } from "./util";

export default defineCommand({
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

		channel.addMessage(message);
	},
});
