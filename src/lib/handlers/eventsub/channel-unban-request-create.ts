import { SystemMessage } from "$lib/models/message/system-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.unban_request.create",
	async handle(data, channel) {
		const viewer = await channel.viewers.fetch(data.user_id);

		channel.addMessage(
			SystemMessage.fromContext({
				type: "unbanRequest",
				request: data,
				viewer,
			}),
		);
	},
});
