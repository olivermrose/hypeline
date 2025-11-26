import { defineHandler } from "../helper";

export default defineHandler({
	name: "stream.offline",
	async handle(data, channel) {
		const broadcaster = await channel.viewers.fetch(data.broadcaster_user_id);
		channel.stream = null;

		channel.chat.addSystemMessage({
			type: "streamStatus",
			online: false,
		});
	},
});
