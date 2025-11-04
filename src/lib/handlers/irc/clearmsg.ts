import { SystemMessage } from "$lib/message";
import type { UserMessage } from "$lib/message";
import { app } from "$lib/state.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "clearmsg",
	handle(data, channel) {
		const message = channel.messages.find(
			(m): m is UserMessage => m.isUser() && m.id === data.message_id,
		);
		if (!message) return;

		message.deleted = true;

		if (
			data.is_recent ||
			(!data.is_recent && app.user && channel.moderators.has(app.user.id))
		) {
			const sysmsg = new SystemMessage(data);
			sysmsg.context = {
				type: "delete",
				text: data.message_text,
				viewer: message.viewer!,
			};

			channel.addMessage(sysmsg);
		}
	},
});
