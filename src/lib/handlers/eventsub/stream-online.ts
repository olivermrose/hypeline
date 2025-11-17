import { SystemMessage } from "$lib/models/message/system-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "stream.online",
	async handle(_, channel) {
		const broadcaster = channel.viewers.get(channel.id);
		if (!broadcaster) return;

		channel.stream = await channel.fetchStream();

		channel.chat.addMessage(
			SystemMessage.fromContext({
				type: "streamStatus",
				online: true,
				broadcaster,
			}),
		);
	},
});
