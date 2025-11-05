import { invoke } from "@tauri-apps/api/core";
import { Channel } from "$lib/channel.svelte";
import { settings } from "$lib/settings";
import { app } from "$lib/state.svelte";
import { User } from "$lib/user.svelte";

export async function load({ parent }) {
	await parent();

	if (!settings.state.user) return;

	app.twitch.token = settings.state.user.token;
	app.user = await app.twitch.users.fetch(settings.state.user.id);

	// TODO: remove when redoing 7TV
	await invoke("set_seventv_id", { id: app.user.id });

	if (!app.channels.length) {
		const following = await app.twitch.fetchFollowing();

		for (const followed of following) {
			const user = new User(followed);
			const channel = new Channel(app.twitch, user, followed.stream);

			app.channels.push(channel);
		}
	}

	if (!app.globalEmotes.size) {
		await app.twitch.fetchEmotes();
	}

	if (!app.globalBadges.size) {
		await app.twitch.fetchBadges();
	}
}
