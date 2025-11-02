import { log } from "$lib/log";
import { settings } from "$lib/settings";

export const ssr = false;

export async function load() {
	await settings.start();
	log.info("Settings synced");
}
