import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.warning.acknowledge",
	async handle(data, channel) {
		const viewer = await channel.viewers.fetch(data.user_id);

		channel.chat.addSystemMessage({
			type: "warnAck",
			viewer,
		});
	},
});
