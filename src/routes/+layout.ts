import { redirect } from "@sveltejs/kit";
import { invoke } from "@tauri-apps/api/core";
import { app } from "$lib/app.svelte";
import { log } from "$lib/log";
import { Channel } from "$lib/models/channel.svelte";
import { User } from "$lib/models/user.svelte";
import { settings } from "$lib/settings";
import type { BasicUser } from "$lib/twitch/irc";
import type { Prefix } from "$lib/util";

export const ssr = false;

export async function load({ url }) {
	if (url.searchParams.has("detached")) {
		return { detached: true };
	}

	if (!settings.state.user) {
		if (url.pathname !== "/auth/login") {
			log.info("User not authenticated, redirecting to login");
			redirect(302, "/auth/login");
		}

		return;
	}

	app.twitch.token ??= settings.state.user.token;
	app.user ??= await app.twitch.users.fetch(settings.state.user.id);

	// TODO: remove when redoing 7TV
	await invoke("set_seventv_id", { id: app.user.id });

	if (!app.user.moderating.size) {
		const { data } = await app.twitch.get<Prefix<BasicUser, "broadcaster">[]>(
			"/moderation/channels",
			{ user_id: app.user.id, first: 100 },
		);

		for (const channel of data) {
			app.user.moderating.add(channel.broadcaster_id);
		}
	}

	if (!app.channels.length) {
		const following = await app.twitch.fetchFollowing();

		for (const followed of following) {
			const user = new User(app.twitch, followed);
			const channel = new Channel(app.twitch, user, followed.stream);

			app.channels.push(channel);
		}

		const self = new Channel(app.twitch, app.user);
		app.channels.push(self);
	}

	if (!app.emotes.size) {
		await app.emotes.fetch();
	}

	if (!app.twitch.badges.size) {
		await app.twitch.fetchBadges();
	}
}
