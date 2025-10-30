import { SystemMessage } from "$lib/message";
import { find } from "$lib/util";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "join",
	async handle(data, channel) {
		// Channel should always have itself in its viewers map
		const viewer = find(channel.viewers, (user) => user.username === data.channel_login);
		if (!viewer) return;

		viewer.isBroadcaster = true;
		viewer.isMod = true;

		channel.messages.push(SystemMessage.fromContext({ type: "join", channel: viewer.user }));
	},
});
