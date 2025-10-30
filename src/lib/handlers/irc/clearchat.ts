import { SystemMessage } from "$lib/message";
import { app } from "$lib/state.svelte";
import { Viewer } from "$lib/viewer.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "clearchat",
	async handle(data, channel) {
		// Return early if the message isn't recent and the user is a moderator
		// in the channel to prevent showing two different messages.
		if (!data.is_recent && app.user?.moderating.has(data.channel_id)) {
			return;
		}

		const message = new SystemMessage(data);

		if (data.action.type === "clear") {
			channel.clearMessages();
			channel.addMessage(message.setContext({ type: "clear" }));
			return;
		}

		const user = await app.fetchUser(data.action.user_id);
		const target = channel.viewers.get(user.id) ?? new Viewer(channel, user);

		channel.clearMessages(user.id);

		if (data.action.type === "ban") {
			message.setContext({
				type: "banStatus",
				banned: true,
				reason: null,
				viewer: target,
			});
		} else {
			message.setContext({
				type: "timeout",
				seconds: data.action.duration.secs,
				reason: null,
				viewer: target,
			});
		}

		channel.addMessage(message);
	},
});
