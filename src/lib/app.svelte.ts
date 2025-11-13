import { invoke, Channel as IpcChannel } from "@tauri-apps/api/core";
import { SvelteMap } from "svelte/reactivity";
import { handlers } from "./handlers";
import { log } from "./log";
import { EmoteManager } from "./managers";
import { TwitchApiClient } from "./twitch/client";
import type { Badge } from "./graphql";
import type { Channel, User } from "./models";
import type { DispatchPayload, Paint } from "./seventv";
import type { NotificationPayload } from "./twitch/eventsub";
import type { IrcMessage } from "./twitch/irc";

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
	 * Provider-specific global emotes.
	 */
	public readonly emotes = new EmoteManager();

	/**
	 * Provider-specific global badges.
	 */
	public readonly badges = new SvelteMap<string, Badge>();

	/**
	 * 7TV paints.
	 */
	public readonly paints = new SvelteMap<string, Paint>();

	// Associates a (u)ser id to a 7TV (b)adge or (p)aint.
	public readonly u2b = new Map<string, Badge | undefined>();
	public readonly u2p = new Map<string, Paint | undefined>();

	public async connect() {
		if (!this.user || this.connected) return;

		const ircChannel = new IpcChannel<IrcMessage>(async (message) => {
			await this.#handle(message.type, message);
		});

		const eventsubChannel = new IpcChannel<NotificationPayload>(async (message) => {
			await this.#handle(message.subscription.type, message.event);
		});

		const seventvChannel = new IpcChannel<DispatchPayload>(async (message) => {
			await this.#handle(
				message.type,
				"object" in message.body ? message.body.object : message.body,
			);
		});

		await Promise.all([
			invoke("connect_irc", { channel: ircChannel }),
			invoke("connect_eventsub", { channel: eventsubChannel }),
			invoke("connect_seventv", { channel: seventvChannel }),
		]);

		this.connected = true;
		log.info("All connections established");
	}

	async #handle(key: string, payload: any) {
		const handler = handlers.get(key);

		// Need to explicitly compare against false to make TypeScript happy
		if (this.joined && handler?.global === false) {
			await handler.handle(payload, this.joined);
		} else if (this.user && handler?.global) {
			await handler.handle(payload, this.user);
		}
	}
}

export const app = new App();
