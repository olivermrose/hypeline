import { tick } from "svelte";
import { app } from "$lib/app.svelte";
import { log } from "$lib/log";
import { storage } from "$lib/stores";

export async function load() {
	storage.state.user = null;
	storage.state.lastJoined = null;

	app.user = null;
	app.focused = null;

	await tick();
	await storage.saveNow();

	log.info("User logged out");
}
