import { app } from "$lib/app.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "entitlement.create",
	async handle(data, channel) {
		const twitch = data.user.connections.find((c) => c.platform === "TWITCH");
		if (!twitch) return;

		const viewer = await channel.viewers.fetch(twitch.id);

		switch (data.kind) {
			case "BADGE": {
				app.u2b.set(viewer.user.id, app.badges.get(data.ref_id));
				break;
			}

			case "PAINT": {
				app.u2p.set(viewer.user.id, app.paints.get(data.ref_id));
				break;
			}
		}
	},
});
