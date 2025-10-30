import { SystemMessage } from "$lib/message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "automod.message.update",
	async handle(data, channel) {
		const viewer = await channel.viewers.fetch(data.user_id);
		const moderator = await channel.viewers.fetch(data.moderator_user_id);

		const message = channel.messages.find((m) => m.id === data.message_id);
		message?.setDeleted();

		channel.addMessage(
			SystemMessage.fromContext({
				type: "autoMod",
				status: data.status,
				viewer,
				moderator,
			}),
		);
	},
});
