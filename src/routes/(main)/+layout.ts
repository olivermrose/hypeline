import { invoke } from "@tauri-apps/api/core";
import { Channel } from "$lib/channel.svelte";
import { settings } from "$lib/settings";
import { app } from "$lib/state.svelte";
import type { Emote } from "$lib/tauri";
import { globalBadgesQuery } from "$lib/twitch/gql";
import { User } from "$lib/user.svelte";

export async function load({ parent, fetch }) {
	await parent();

	if (!settings.state.user) return;

	app.twitch.token = settings.state.user.token;
	app.user = await app.twitch.users.fetch(settings.state.user.id);

	// TODO: stopgap
	await invoke("set_seventv_id");

	if (!app.channels.length) {
		const following = await app.twitch.fetchFollowing();

		for (const followed of following) {
			const user = new User(followed);
			const channel = new Channel(app.twitch, user, followed.stream);

			app.channels.push(channel);
		}
	}

	if (!app.globalEmotes.size) {
		const emotes = await invoke<Emote[]>("fetch_global_emotes");

		for (const emote of emotes) {
			app.globalEmotes.set(emote.name, emote);
		}
	}

	if (!app.globalBadges.size) {
		const { data } = await app.twitch.send(globalBadgesQuery);
		const badges = data.badges?.filter((b) => b != null) ?? [];

		for (const badge of badges) {
			app.globalBadges.set(`${badge.setID}:${badge.version}`, badge);
		}
	}
}
