import { app } from "$lib/app.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.chat.user_message_update",
	handle(data) {
		const channel = app.channels.get(data.broadcaster_user_id);
		if (!channel || data.status === "invalid") return;

		const message = channel.chat.messages.find((m) => m.id === data.message_id);
		if (message) message.deleted = true;

		channel.chat.addSystemMessage(`A moderator ${data.status} your message.`);
	},
});
