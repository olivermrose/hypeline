import { app } from "$lib/app.svelte";
import { SystemMessage } from "$lib/models/message/system-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "clearchat",
	async handle(data, channel) {
		// Return early if the message isn't recent and the user is a moderator
		// in the channel to prevent showing two different messages.
		if (!data.is_recent && app.user?.moderating.has(channel.id)) {
			return;
		}

		const message = new SystemMessage(data);

		if (data.action.type === "clear") {
			channel.chat.deleteMessages();

			message.context = { type: "clear" };
			channel.chat.addMessage(message);

			return;
		}

		const target = await channel.viewers.fetch(data.action.user_id);
		channel.chat.deleteMessages(target.id);

		if (data.action.type === "ban") {
			message.context = {
				type: "banStatus",
				banned: true,
				reason: null,
				viewer: target,
			};
		} else {
			message.context = {
				type: "timeout",
				seconds: data.action.duration.secs,
				reason: null,
				viewer: target,
			};
		}

		channel.chat.addMessage(message);
	},
});
