import { app } from "$lib/app.svelte";
import type { UserMessage } from "$lib/models/message/user-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "automod.message.update",
	async handle(data) {
		const channel = app.channels.get(data.broadcaster_user_id);
		if (!channel) return;

		const viewer = await channel.viewers.fetch(data.user_id);
		const moderator = await channel.viewers.fetch(data.moderator_user_id);

		const message = channel.chat.messages.find(
			(m): m is UserMessage => m.id === data.message_id,
		);

		if (message) message.deleted = true;

		channel.chat.addSystemMessage({
			type: "autoMod",
			status: data.status,
			viewer,
			moderator,
		});
	},
});
