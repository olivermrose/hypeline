import { log } from "$lib/log";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "join",
	async handle(data, channel) {
		// Channel should always have itself in its viewers map
		const viewer = channel.viewers
			.values()
			.find((user) => user.username === data.channel_login);

		if (!viewer) return;

		viewer.broadcaster = true;
		viewer.moderator = true;

		channel.chat.addSystemMessage({ type: "join" });

		log.info(`Joined ${channel.user.displayName}`);
	},
});
