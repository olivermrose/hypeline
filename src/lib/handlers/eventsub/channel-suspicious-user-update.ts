import { SystemMessage } from "$lib/models/message/system-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.suspicious_user.update",
	async handle(data, channel) {
		const viewer = await channel.viewers.fetch(data.user_id);
		const moderator = await channel.viewers.fetch(data.moderator_user_id);

		const status = data.low_trust_status;

		// Only update status if the user is not already monitored or
		// restricted.
		if (!viewer.monitored && !viewer.restricted) {
			// No previous information available so it doesn't make sense to
			// send the message since we don't know what changed.
			if (status === "no_treatment") return;

			viewer.monitored = status === "active_monitoring";
			viewer.restricted = status === "restricted";
		}

		channel.chat.addMessage(
			SystemMessage.fromContext({
				type: "suspicionStatus",
				active: status !== "no_treatment",
				previous: viewer.monitored
					? "monitoring"
					: viewer.restricted
						? "restricting"
						: null,
				viewer,
				moderator,
			}),
		);

		// Update AFTER message is sent so the previous status is available.
		viewer.monitored = status === "active_monitoring";
		viewer.restricted = status === "restricted";
	},
});
