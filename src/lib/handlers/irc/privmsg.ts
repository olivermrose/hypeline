import { UserMessage } from "$lib/models/message/user-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "privmsg",
	handle(data, channel) {
		const message = new UserMessage(channel, data);

		message.author.username = data.sender.login;
		message.author.displayName = data.sender.name;

		if (message.viewer) {
			message.viewer.broadcaster = message.badges.some((b) => b.startsWith("broadcaster"));
			message.viewer.moderator = message.viewer.broadcaster || data.is_mod;
			message.viewer.subscriber = data.is_subscriber;
			message.viewer.vip = message.badges.some((b) => b.startsWith("vip"));
			message.viewer.returning = data.is_returning_chatter;
			message.viewer.new = data.is_first_msg;
		}

		channel.addMessage(message);
	},
});
