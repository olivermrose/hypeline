import { error } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { app } from "$lib/app.svelte";
import { settings } from "$lib/settings";

export async function load({ params, parent }) {
	if (dev) await parent();

	const channel = app.channels.getByLogin(params.username);

	if (!channel) {
		await app.joined?.leave();
		error(404);
	}

	// If it's not the same channel and it's not already joined, join it
	if (app.joined !== channel && !channel.joined) {
		if (settings.state.advanced.singleConnection) {
			await app.joined?.leave();
		}

		await channel.join();
	}

	return {
		channel,
		titleBar: {
			icon: channel.user.avatarUrl,
			title: channel.user.displayName,
			guests: channel.stream?.guests.size ?? 0,
		},
	};
}
