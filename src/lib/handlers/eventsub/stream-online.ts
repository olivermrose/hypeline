import { app } from "$lib/app.svelte";
import { SystemMessage } from "$lib/message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "stream.online",
	async handle(data, channel) {
		const broadcaster = await channel.viewers.fetch(data.broadcaster_user_id);
		channel.stream = await app.twitch.fetchStream(data.broadcaster_user_id);

		channel.addMessage(
			SystemMessage.fromContext({
				type: "streamStatus",
				online: true,
				broadcaster,
			}),
		);
	},
});
