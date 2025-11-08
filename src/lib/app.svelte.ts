import { SvelteMap } from "svelte/reactivity";
import { EmoteManager } from "./managers";
import { TwitchApiClient } from "./twitch/client";
import type { Badge } from "./graphql";
import type { Channel, User } from "./models";
import type { Paint } from "./seventv";

class App {
	public readonly twitch = new TwitchApiClient();

	/**
	 * Whether the app has made all necessary connections.
	 */
	public connected = $state(false);

	/**
	 * The currently authenticated user.
	 */
	public user?: User;

	/**
	 * The currently joined channel.
	 */
	public joined = $state<Channel | null>(null);

	/**
	 * The list of channels the app is able to join.
	 */
	public channels = $state<Channel[]>([]);

	/**
	 * Global emotes from FFZ, BTTV, and 7TV.
	 */
	public readonly emotes = new EmoteManager();

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
}

export const app = new App();
