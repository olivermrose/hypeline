import { UserMessage } from "$lib/models";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "usernotice",
	async handle(data, channel) {
		const message = new UserMessage(channel, data);

		if (message.source && message.source.channel_id !== channel.id) {
			const source = await channel.viewers.fetch(message.source.channel_id);

			if (!source.user.avatarUrl) {
				await source.user.fetch();
			}
		}

		channel.addMessage(message);
	},
});
