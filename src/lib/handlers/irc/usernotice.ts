import { UserMessage } from "$lib/models/message/user-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "usernotice",
	async handle(data, channel) {
		const message = new UserMessage(channel, data);

		if (message.event?.type === "raid" && !data.is_recent && channel.stream) {
			channel.stream.viewers += message.event.viewer_count;
		}

		if (message.source && message.source.channel_id !== channel.id) {
			const source = await channel.viewers.fetch(message.source.channel_id);

			if (!source.user.avatarUrl) {
				await source.user.fetch();
			}
		}

		channel.chat.addMessage(message);
	},
});
