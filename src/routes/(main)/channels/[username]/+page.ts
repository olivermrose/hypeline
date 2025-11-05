import { error } from "@sveltejs/kit";
import { app } from "$lib/state.svelte";

export async function load({ params }) {
	await app.joined?.leave();

	const channel = app.channels.find((c) => c.user.username === params.username);
	if (!channel) error(404);

	await channel.join();

	// if (params.username.startsWith("ephemeral:")) {
	// 	channel.ephemeral = true;
	// 	app.channels.push(channel);
	// }
	//
	return { channel };
}
