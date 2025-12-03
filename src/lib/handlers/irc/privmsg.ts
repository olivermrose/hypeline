import { app } from "$lib/app.svelte";
import { UserMessage } from "$lib/models/message/user-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "privmsg",
	async handle(data) {
		const channel = app.channels.get(data.channel_id);
		if (!channel) return;

		const message = new UserMessage(channel, data);

		message.author.username = data.sender.login;
		message.author.displayName = data.sender.name;

		message.viewer ??= await channel.viewers.fetch(data.sender.id);
		message.viewer.broadcaster = message.badges.some((b) => b.startsWith("broadcaster"));
		message.viewer.moderator = message.viewer.broadcaster || data.is_mod;
		message.viewer.subscriber = data.is_subscriber;
		message.viewer.vip = message.badges.some((b) => b.startsWith("vip"));
		message.viewer.returning = data.is_returning_chatter;
		message.viewer.new = data.is_first_msg;

		if (data.source) {
			await message.setSource(data.source);
		}

		channel.chat.addMessage(message);
	},
});
