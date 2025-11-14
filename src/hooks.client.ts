import { log } from "$lib/log";
import { settings } from "$lib/settings";

export async function init() {
	await settings.start();
	log.info("Settings synced");
}
