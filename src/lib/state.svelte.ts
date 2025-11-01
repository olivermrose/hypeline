import { invoke } from "@tauri-apps/api/core";
import { SvelteMap } from "svelte/reactivity";
import { settings } from "./settings";
import { User } from "./user.svelte";
import { Viewer } from "./viewer.svelte";
import type { Channel } from "./channel.svelte";
import type { Paint } from "./seventv";
import type { Emote, UserWithColor } from "./tauri";
import type { Badge } from "./twitch/api";

class AppState {
	#requests = new Map<string, Promise<User>>();

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
	public readonly globalBadges = new SvelteMap<string, Record<string, Badge>>();

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

	public async fetchUser(id: string) {
		const inProgress = this.#requests.get(id);
		if (inProgress) return await inProgress;

		const request = (async () => {
			try {
				const data = await invoke<UserWithColor>("get_user_from_id", { id });
				const user = new User(data);

				if (id === settings.state.user?.id) {
					const channels = await invoke<[string, string][]>("get_moderated_channels");
					channels.forEach(([id, name]) => user.moderating.set(id, name));
				}

				if (this.joined) {
					const viewer = new Viewer(this.joined, user);
					this.joined.viewers.set(user.id, viewer);
				}

				return user;
			} finally {
				this.#requests.delete(id);
			}
		})();

		this.#requests.set(id, request);
		return await request;
	}
}

export const app = new AppState();
