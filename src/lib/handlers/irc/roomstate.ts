import { defineHandler } from "../helper";

export default defineHandler({
	name: "roomstate",
	handle(data, channel) {
		if (data.is_recent) return;

		if (data.followers_only === -1) {
			channel.chat.mode.followerOnly = false;
		} else {
			channel.chat.mode.followerOnly = data.followers_only ?? false;
		}

		channel.chat.mode.emoteOnly = !!data.emote_only;
		channel.chat.mode.unique = !!data.unique_mode;
		channel.chat.mode.slow = data.slow_mode ?? false;
		channel.chat.mode.subOnly = !!data.subscribers_only;
	},
});
