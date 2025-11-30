import { invoke } from "@tauri-apps/api/core";
import { send7tv as send } from "$lib/graphql";
import { seventvGql, twitchGql } from "$lib/graphql/function";
import { ChannelEmoteManager } from "$lib/managers/channel-emote-manager";
import { app } from "../app.svelte";
import {
	badgeDetailsFragment,
	cheermoteDetailsFragment,
	streamDetailsFragment,
} from "../graphql/fragments";
import { ViewerManager } from "../managers/viewer-manager";
import { settings } from "../settings";
import type { Badge, Cheermote } from "../graphql/fragments";
import type { StreamMarker } from "../twitch/api";
import type { TwitchClient } from "../twitch/client";
import { Chat } from "./chat.svelte";
import { Stream } from "./stream.svelte";
import { Viewer } from "./viewer.svelte";
import type { User } from "./user.svelte";

export class Channel {
	#seventvId: string | null = null;

	public readonly id: string;

	/**
	 * The chat associated with the channel.
	 */
	public readonly chat: Chat;

	/**
	 * The badges in the channel.
	 */
	public readonly badges = new Map<string, Badge>();

	/**
	 * The emotes in the channel.
	 */
	public readonly emotes: ChannelEmoteManager;

	/**
	 * The cheermotes in the channel.
	 */
	public readonly cheermotes = $state<Cheermote[]>([]);

	/**
	 * The viewers in the channel.
	 */
	public readonly viewers: ViewerManager;

	/**
	 * The stream associated with the channel if it's currently live.
	 */
	public stream = $state<Stream | null>(null);

	/**
	 * Whether the channel is ephemeral.
	 */
	public ephemeral = false;

	/**
	 * The id of the active 7TV emote set for the channel if any.
	 */
	public emoteSetId = $state<string | null>(null);

	public constructor(
		public readonly client: TwitchClient,

		/**
		 * The user for the channel.
		 */
		public readonly user: User,
		stream: Stream | null = null,
	) {
		this.id = user.id;
		this.stream = stream;

		this.chat = new Chat(this);
		this.emotes = new ChannelEmoteManager(this);
		this.viewers = new ViewerManager(this);
	}

	public async join() {
		app.joined = this;
		settings.state.lastJoined = this.ephemeral ? null : this.user.username;

		if (!this.viewers.has(this.id)) {
			const viewer = new Viewer(this, this.user);
			viewer.broadcaster = true;

			this.viewers.set(this.id, viewer);
		}

		await Promise.all([
			this.fetchStream(),
			this.#fetch7tvId(),
			this.emotes.fetch(),
			this.fetchBadges(),
			this.fetchCheermotes(),
		]);

		await this.stream?.fetchGuests();

		await invoke("join", {
			id: this.id,
			stvId: this.#seventvId,
			setId: this.emoteSetId,
			login: this.user.username,
			isMod: app.user?.moderating.has(this.id),
		});

		if (settings.state.chat.messages.history.enabled) {
			await invoke("fetch_recent_messages", {
				channel: this.user.username,
				historyLimit: settings.state.chat.messages.history.limit,
			});
		}
	}

	public async leave() {
		try {
			await invoke("leave", { channel: this.user.username });
		} finally {
			this.reset();
			settings.state.lastJoined = null;

			if (app.user) {
				app.user.banned = false;
			}
		}
	}

	public async rejoin() {
		await invoke("rejoin", { channel: this.user.username });

		if (app.user) {
			app.user.banned = false;
		}
	}

	public addBadges(badges: Badge[]) {
		for (const badge of badges) {
			this.badges.set(`${badge.setID}:${badge.version}`, badge);
		}

		return this;
	}

	public addCheermotes(cheermotes: Cheermote[]) {
		for (const cheermote of cheermotes) {
			this.cheermotes.push(cheermote);
		}

		return this;
	}

	public reset() {
		this.chat.reset();
		this.badges.clear();
		this.emotes.clear();
		this.viewers.clear();
	}

	/**
	 * Retrieves the list of badges in the channel and caches them for later use.
	 */
	public async fetchBadges(force = false) {
		if (!force && this.badges.size) return;

		const { user } = await this.client.send(
			twitchGql(
				`query GetChannelBadges($id: ID!) {
					user(id: $id) {
						broadcastBadges {
							...BadgeDetails
						}
					}
				}`,
				[badgeDetailsFragment],
			),
			{ id: this.id },
		);

		for (const badge of user?.broadcastBadges?.filter((b) => b != null) ?? []) {
			this.badges.set(`${badge.setID}:${badge.version}`, badge);
		}
	}

	/**
	 * Retrieves the list of cheermotes in the channel and caches them for later
	 * use.
	 */
	public async fetchCheermotes() {
		const { user } = await this.client.send(
			twitchGql(
				`query GetCheermotes($id: ID!) {
					user(id: $id) {
						cheer {
							emotes(type: [FIRST_PARTY, THIRD_PARTY, CUSTOM]) {
							...CheermoteDetails
							}
						}
					}
				}`,
				[cheermoteDetailsFragment],
			),
			{ id: this.id },
		);

		this.cheermotes.push(...(user?.cheer?.emotes.filter((e) => e != null) ?? []));
		return this.cheermotes;
	}

	/**
	 * Retrieves the stream of the channel if it's live.
	 */
	public async fetchStream() {
		const { user } = await this.client.send(
			twitchGql(
				`query GetStream($id: ID!) {
					user(id: $id) {
						stream {
							...StreamDetails
						}
					}
				}`,
				[streamDetailsFragment],
			),
			{ id: this.id },
		);

		if (user?.stream) {
			this.stream = new Stream(this.client, this.id, user.stream);
		}

		return this.stream;
	}

	public async createMarker(description?: string) {
		const { data } = await this.client.post<StreamMarker>("/streams/markers", {
			body: {
				user_id: this.id,
				description,
			},
		});

		return data;
	}

	public async raid(to: string) {
		if (!app.user?.moderating.has(this.id)) {
			return;
		}

		await this.client.post("/raids", {
			params: {
				from_broadcaster_id: this.id,
				to_broadcaster_id: to,
			},
		});
	}

	public async unraid() {
		if (!app.user?.moderating.has(this.id)) {
			return;
		}

		await this.client.delete("/raids", { broadcaster_id: this.id });
	}

	public async shoutout(to: string) {
		if (!app.user?.moderating.has(this.id)) {
			return;
		}

		await this.client.post("/chat/shoutouts", {
			params: {
				from_broadcaster_id: this.id,
				to_broadcaster_id: to,
				moderator_id: app.user.id,
			},
		});
	}

	async #fetch7tvId() {
		const response = await send(
			seventvGql(
				`query GetUser($id: String!) {
					users {
						userByConnection(platform: TWITCH, platformId: $id) {
							id
						}
					}
				}`,
			),
			{ id: this.id },
		).catch(() => null);

		this.#seventvId = response?.users.userByConnection?.id ?? null;
	}
}
