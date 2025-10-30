import { SystemMessage } from "$lib/message";
import type { Viewer } from "$lib/viewer.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.unban_request.resolve",
	async handle(data, channel) {
		const viewer = await channel.viewers.fetch(data.user_id);

		let moderator: Viewer | undefined;

		if (data.moderator_user_id) {
			moderator = await channel.viewers.fetch(data.moderator_user_id);
		}

		channel.addMessage(
			SystemMessage.fromContext({
				type: "unbanRequest",
				request: data,
				viewer,
				moderator,
			}),
		);
	},
});
