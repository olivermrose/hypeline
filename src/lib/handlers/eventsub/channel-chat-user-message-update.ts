import { SystemMessage } from "$lib/models/message/system-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.chat.user_message_update",
	handle(data, channel) {
		if (data.status === "invalid") return;

		const message = channel.messages.find((m) => m.id === data.message_id);
		if (message) message.deleted = true;

		channel.addMessage(new SystemMessage(`A moderator ${data.status} your message.`));
	},
});
