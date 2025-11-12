import { app } from "$lib/app.svelte";

export function load() {
	if (!app.user) return;

	return { whispers: app.user.whispers };
}
