import { SystemMessage } from "$lib/models";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "stream.online",
	async handle(_, channel) {
		const broadcaster = channel.viewers.get(channel.id);
		if (!broadcaster) return;

		channel.stream = await channel.fetchStream();

		channel.addMessage(
			SystemMessage.fromContext({
				type: "streamStatus",
				online: true,
				broadcaster,
			}),
		);
	},
});
