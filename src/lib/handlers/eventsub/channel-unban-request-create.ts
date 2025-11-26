import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.unban_request.create",
	async handle(data, channel) {
		const viewer = await channel.viewers.fetch(data.user_id);

		channel.chat.addSystemMessage({
			type: "unbanRequest",
			request: data,
			viewer,
		});
	},
});
