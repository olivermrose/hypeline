import { app } from "$lib/app.svelte";
import { SystemMessage } from "$lib/models";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "notice",
	async handle(data, channel) {
		if (!data.is_recent && app.user?.moderating.has(channel.id)) {
			return;
		}

		const message = new SystemMessage({
			deleted: data.deleted,
			is_recent: data.is_recent,
			server_timestamp: data.recent_timestamp ?? Date.now(),
		});

		switch (data.message_id) {
			case "emote_only_on":
			case "emote_only_off":
			case "followers_on":
			case "followers_on_zero":
			case "followers_off":
			case "r9k_on":
			case "r9k_off":
			case "slow_on":
			case "slow_off":
			case "subs_on":
			case "subs_off": {
				const text = data.message_text
					.replace("This room", "The chat")
					.replace("s-only", "-only");

				message.text = text;
				channel.addMessage(message);

				break;
			}
		}
	},
});
