import { UserMessage } from "$lib/message";
import { app } from "$lib/state.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "privmsg",
	handle(data, channel) {
		const message = new UserMessage(data);

		message.author.setUsername(data.sender.login);
		message.author.setDisplayName(data.sender.login);

		if (message.viewer) {
			message.viewer.isBroadcaster = message.badges.some((b) => b.name === "broadcaster");
			message.viewer.isMod = message.viewer.isBroadcaster || data.is_mod;
			message.viewer.isSub = data.is_subscriber;
			message.viewer.isVip = message.badges.some((b) => b.name === "vip");
			message.viewer.isReturning = data.is_returning_chatter;
		}

		message.author.badge = app.u2b.get(message.author.id);
		message.author.paint = app.u2p.get(message.author.id);

		channel.addMessage(message);
	},
});
