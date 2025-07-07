import { app } from "$lib/app.svelte";
import { log } from "$lib/log";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "part",
	handle(data) {
		log.info(`Left ${data.channel_login}`);

		if (app.user) {
			app.user.banned = false;
		}
	},
});
