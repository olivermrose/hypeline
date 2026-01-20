import { app } from "$lib/app.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "stream.offline",
	async handle(data) {
		const channel = app.channels.get(data.broadcaster_user_id);
		if (!channel) return;

		channel.stream = null;

		channel.chat.addSystemMessage({
			type: "streamStatus",
			online: false,
		});
	},
});
