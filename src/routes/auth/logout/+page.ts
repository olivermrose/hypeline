import { tick } from "svelte";
import { app } from "$lib/app.svelte";
import { log } from "$lib/log";
import { settings } from "$lib/settings";

export async function load() {
	settings.state.user = null;
	settings.state.lastJoined = null;

	app.user = null;
	app.joined = null;

	await tick();
	await settings.saveNow();

	log.info("User logged out");
}
