import { invoke } from "@tauri-apps/api/core";
import { SvelteMap } from "svelte/reactivity";
import { Channel } from "./channel.svelte";
import { commands } from "./commands";
import { TwitchApiClient } from "./twitch/client";
import { User } from "./user.svelte";
import { Viewer } from "./viewer.svelte";
import type { Paint } from "./seventv";
import type { Emote, JoinedChannel } from "./tauri";
import type { Badge } from "./twitch/gql";

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
			isMod: this.user
				? // eslint-disable-next-line unicorn/prefer-includes
					this.user.moderating.values().some((name) => name === username)
				: false,
		}).catch(() => null);

		if (!joined) return null;

		let channel = this.channels.find((c) => c.user.username === username);

		if (!channel) {
			const user = new User({
				id: joined.user.data.id,
				login: joined.user.data.login,
				displayName: joined.user.data.display_name,
				chatColor: joined.user.color,
				createdAt: joined.user.data.created_at,
				roles: {
					isStaff: joined.user.data.type === "staff",
					isAffiliate: joined.user.data.broadcaster_type === "affiliate",
					isPartner: joined.user.data.broadcaster_type === "partner",
				},
				description: "",
				profileImageURL: joined.user.data.profile_image_url,
				bannerImageURL: joined.user.data.offline_image_url,
			});

			channel = new Channel(this.twitch, user);
		}

		if (!channel.viewers.has(channel.id)) {
			const viewer = new Viewer(channel, channel.user);
			viewer.broadcaster = true;

			channel.viewers.set(channel.id, viewer);
		}

		await channel.fetchBadges();

		channel = channel
			.addCommands(commands)
			.addEmotes(joined.emotes)
			.addCheermotes(joined.cheermotes);

		// channel.stream = joined.stream;
		channel.emoteSet = joined.emote_set ?? undefined;

		this.joined = channel;
		return channel;
	}
}

export const app = new AppState();
