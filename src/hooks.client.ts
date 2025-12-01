import { cache } from "$lib/cache";
import { log } from "$lib/log";
import { settings } from "$lib/settings";

export async function init() {
	await cache.start();
	log.info("Cache synced");

	await settings.start();
	log.info("Settings synced");
}
