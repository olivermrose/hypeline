import { stats } from "tauri-plugin-cache-api";
import { log } from "$lib/log";
import { settings } from "$lib/settings";

export async function init() {
	const { totalSize } = await stats();
	log.info(`Cache has ${totalSize} items`);

	await settings.start();
	log.info("Settings synced");
}
