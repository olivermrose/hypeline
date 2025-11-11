import { error } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { app } from "$lib/app.svelte";

export async function load({ params, parent }) {
	if (dev) await parent();

	const channel = app.channels.find((c) => c.user.username === params.username);

	if (!channel) {
		await app.joined?.leave();
		error(404);
	}

	if (app.joined !== channel) {
		await app.joined?.leave();
		await channel.join();
	}

	return { channel };
}
