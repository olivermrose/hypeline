import { redirect } from "@sveltejs/kit";
import { settings } from "$lib/settings";

export function load() {
	if (settings.state["advanced.singleConnection"]) {
		redirect(302, "/");
	}
}
