import { app } from "$lib/app.svelte";
import { SystemMessage } from "$lib/models";
import { defineCommand, getTarget } from "./util";

export default defineCommand({
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

		channel.addMessage(message);
	},
});
