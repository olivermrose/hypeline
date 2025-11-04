import { invoke } from "@tauri-apps/api/core";
import { SvelteMap } from "svelte/reactivity";
import { Channel } from "./channel.svelte";
import { commands } from "./commands";
import { TwitchApiClient } from "./twitch/client";
import { Viewer } from "./viewer.svelte";
import type { Paint } from "./seventv";
import type { Emote, JoinedChannel } from "./tauri";
import type { Badge } from "./twitch/gql";
import type { User } from "./user.svelte";

class AppState {
	public readonly twitch = new TwitchApiClient();

	/**
	 * The currently joined channel.
	 */
	public joined = $state<Channel | null>(null);
	public connected = $state(false);

	/**
	 * The currently authenticated user.
	 */
	public user?: User;
	public channels = $state<Channel[]>([]);

	/**
	 * Global emotes from Twitch, 7TV, BTTV, and FFZ.
	 */
	public readonly globalEmotes = new SvelteMap<string, Emote>();

	/**
	 * Global badges from Twitch.
	 */
	public readonly globalBadges = new SvelteMap<string, Badge>();

	/**
	 * Provider-specific badges.
	 */
	public readonly badges = new SvelteMap<string, Badge>();

	/**
	 * 7TV paints.
	 */
	public readonly paints = new SvelteMap<string, Paint>();

	// Associates a (u)ser id to a 7TV (b)adge or (p)aint.
	public readonly u2b = new Map<string, Badge | undefined>();
	public readonly u2p = new Map<string, Paint | undefined>();

	public async joinChannel(username: string) {
		const joined = await invoke<JoinedChannel>("join", {
			login: username,
			// TODO: stopgap
			isMod: true,
		}).catch(() => null);

		if (!joined) return null;

		let channel = this.channels.find((c) => c.user.username === username);

		if (!channel) {
			const user = await this.twitch.users.fetch(username, "login");
			channel = new Channel(this.twitch, user);
		}

		if (!channel.viewers.has(channel.id)) {
			const viewer = new Viewer(channel, channel.user);
			viewer.broadcaster = true;

			channel.viewers.set(channel.id, viewer);
		}

		const [stream] = await Promise.all([
			this.twitch.fetchStream(channel.id),
			channel.fetchBadges(),
			channel.fetchCheermotes(),
		]);

		channel = channel.addCommands(commands).addEmotes(joined.emotes);

		channel.stream = stream;
		channel.emoteSet = joined.emote_set ?? undefined;

		this.joined = channel;
		return channel;
	}
}

export const app = new AppState();
