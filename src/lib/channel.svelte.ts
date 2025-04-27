import { invoke } from "@tauri-apps/api/core";
import { SvelteMap } from "svelte/reactivity";
import { replyTarget } from "./components/Input.svelte";
import type { Message } from "./message";
import { settings } from "./settings";
import type { JoinedChannel } from "./tauri";
import type { Badge, BadgeSet, Stream } from "./twitch/api";
import type { IrcMessage } from "./twitch/irc";
import { User } from "./user";
import { Viewer } from "./viewer.svelte";

export interface Emote {
	name: string;
	url: string;
	width: number;
	height: number;
}

export class Channel {
	public readonly badges = new SvelteMap<string, Record<string, Badge>>();
	public readonly emotes = new SvelteMap<string, Emote>();
	public readonly viewers = new SvelteMap<string, Viewer>();

	public recentMessages = $state<IrcMessage[]>([]);
	public messages = $state<Message[]>([]);

	public constructor(
		/**
		 * The user for the channel.
		 */
		public readonly user: User,

		/**
		 * The stream associated with the channel if it's currently streaming.
		 */
		public stream: Stream | null = null,
	) {}

	/**
	 * An "empty" channel to use during app initialization.
	 *
	 * This is to prevent {@linkcode app.active} being possibly `null` and
	 * using optional chaining everywhere.
	 */
	public static empty() {
		const emptyUser = new User({
			data: {
				id: "",
				login: "",
				display_name: "",
				type: "",
				broadcaster_type: "",
				description: "",
				profile_image_url: "",
				offline_image_url: "",
				created_at: "",
			},
			color: null,
		});

		return new Channel(emptyUser);
	}

	public static async join(login: string) {
		const joined = await invoke<JoinedChannel>("join", {
			login,
			historyLimit: settings.state.historyLimit,
		});

		const user = new User(joined.user);

		const channel = new Channel(user)
			.addBadges(joined.badges)
			.addEmotes(joined.emotes)
			.setStream(joined.stream);

		const viewer = new Viewer(user);
		viewer.broadcaster = true;

		channel.viewers.set(user.username, viewer);
		channel.recentMessages = joined.recent_messages;

		return channel;
	}

	public async leave() {
		await invoke("leave", { channel: this.user.username });

		this.messages = [];
		this.badges.clear();
		this.emotes.clear();
		this.viewers.clear();
	}

	public addBadges(badges: BadgeSet[]) {
		for (const set of badges) {
			const badges: Record<string, Badge> = {};

			for (const version of set.versions) {
				badges[version.id] = version;
			}

			this.badges.set(set.set_id, badges);
		}

		return this;
	}

	public addEmotes(emotes: Record<string, Emote> | Map<string, Emote>) {
		const entries = emotes instanceof Map ? emotes : Object.entries(emotes);

		for (const [name, emote] of entries) {
			this.emotes.set(name, emote);
		}

		return this;
	}

	public async send(message: string) {
		await invoke("send_message", {
			content: message,
			broadcasterId: this.user.id,
			replyId: replyTarget.value?.id ?? null,
		});
	}

	public setStream(stream: Stream | null) {
		this.stream = stream;
		return this;
	}
}
