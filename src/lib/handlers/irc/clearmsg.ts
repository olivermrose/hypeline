import { app } from "$lib/app.svelte";
import { SystemMessage } from "$lib/models/message/system-message";
import type { UserMessage } from "$lib/models/message/user-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "clearmsg",
	handle(data, channel) {
		const message = channel.chat.messages.find(
			(m): m is UserMessage => m.isUser() && m.id === data.message_id,
		);
		if (!message) return;

		message.deleted = true;

		if (data.is_recent || (!data.is_recent && app.user?.moderating.has(channel.id))) {
			const sysmsg = new SystemMessage(channel, data);

			sysmsg.context = {
				type: "delete",
				text: data.message_text,
				user: message.author,
			};

			channel.chat.addMessage(sysmsg);
		}
	},
});
