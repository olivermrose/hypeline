import { SystemMessage } from "$lib/message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "stream.offline",
	async handle(data, channel) {
		const broadcaster = await channel.viewers.fetch(data.broadcaster_user_id);

		channel.setStream(null).addMessage(
			SystemMessage.fromContext({
				type: "streamStatus",
				online: false,
				broadcaster,
			}),
		);
	},
});
