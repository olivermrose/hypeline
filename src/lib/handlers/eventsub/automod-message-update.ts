import { defineHandler } from "../helper";

export default defineHandler({
	name: "automod.message.update",
	async handle(data, channel) {
		const viewer = await channel.viewers.fetch(data.user_id);
		const moderator = await channel.viewers.fetch(data.moderator_user_id);

		const message = channel.chat.messages.find((m) => m.id === data.message_id);
		if (message) message.deleted = true;

		channel.chat.addSystemMessage({
			type: "autoMod",
			status: data.status,
			viewer,
			moderator,
		});
	},
});
