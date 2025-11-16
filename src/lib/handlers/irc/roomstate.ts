import { defineHandler } from "../helper";

export default defineHandler({
	name: "roomstate",
	handle(data, channel) {
		if (data.followers_only === -1) {
			channel.chatMode.followerOnly = false;
		} else {
			channel.chatMode.followerOnly = data.followers_only ?? false;
		}

		channel.chatMode.emoteOnly = !!data.emote_only;
		channel.chatMode.unique = !!data.unique_mode;
		channel.chatMode.slow = data.slow_mode ?? false;
		channel.chatMode.subOnly = !!data.subscribers_only;
	},
});
