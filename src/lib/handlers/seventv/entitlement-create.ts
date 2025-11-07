import { app } from "$lib/app.svelte";
import { log } from "$lib/log";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "entitlement.create",
	async handle(data, channel) {
		const twitch = data.user.connections.find((c) => c.platform === "TWITCH");
		if (!twitch) return;

		const viewer = await channel.viewers.fetch(twitch.id);

		switch (data.kind) {
			case "BADGE": {
				log.debug(`Assigned badge ${data.ref_id} to ${viewer.username}`);

				viewer.user.badge = app.badges.get(data.ref_id);
				app.u2b.set(viewer.user.id, viewer.user.badge);

				break;
			}

			case "PAINT": {
				log.debug(`Assigned paint ${data.ref_id} to ${viewer.user.username}`);

				viewer.user.paint = app.paints.get(data.ref_id);
				app.u2p.set(viewer.user.id, viewer.user.paint);

				break;
			}
		}
	},
});
