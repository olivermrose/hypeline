import { UserMessage } from "$lib/message";
import { app } from "$lib/state.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "privmsg",
	handle(data, channel) {
		const message = new UserMessage(data);

		message.author.username = data.sender.login;
		message.author.displayName = data.sender.name;

		if (message.viewer) {
			message.viewer.broadcaster = message.badges.some((b) => b.name === "broadcaster");
			message.viewer.moderator = message.viewer.broadcaster || data.is_mod;
			message.viewer.subscriber = data.is_subscriber;
			message.viewer.vip = message.badges.some((b) => b.name === "vip");
			message.viewer.returning = data.is_returning_chatter;
		}

		message.author.badge = app.u2b.get(message.author.id);
		message.author.paint = app.u2p.get(message.author.id);

		channel.addMessage(message);
	},
});
