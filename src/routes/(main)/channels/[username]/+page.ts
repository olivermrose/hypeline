import { error } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { app } from "$lib/app.svelte";

export async function load({ params, parent }) {
	if (dev) await parent();

	await app.joined?.leave();

	const channel = app.channels.find((c) => c.user.username === params.username);
	if (!channel) error(404);

	await channel.join();

	return { channel };
}
