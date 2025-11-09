import { invoke } from "@tauri-apps/api/core";
import { SvelteMap } from "svelte/reactivity";
import { app } from "../app.svelte";
import { commands } from "../commands";
import { log } from "../log";
import { ChannelEmoteManager, ViewerManager } from "../managers";
import { settings } from "../settings";
import type { Command } from "../commands/util";
import type { Badge, Stream } from "../graphql";
import type { BadgeSet, Cheermote, SentMessage, StreamMarker } from "../twitch/api";
import type { TwitchApiClient } from "../twitch/client";
import { Viewer } from "./viewer.svelte";
import type { User } from "./user.svelte";
import { SystemMessage } from "./";
import type { Message } from "./";

const RATE_LIMIT_WINDOW = 30 * 1000;
const RATE_LIMIT_GRACE = 1000;

export interface ChatSettings {
	unique?: boolean;
	subOnly?: boolean;
	emoteOnly?: boolean;
	followerOnly?: boolean;
	followerOnlyDuration?: number;
	slow?: number;
}

export class Channel {
	#bypassNext = false;
	#lastRecentAt: number | null = null;

	#lastMessage: number[] = [];
	#lastMessageElevated: number[] = [];
	#lastHitSpdAt: number;
	#lastHitAmtAt: number;

	public readonly id: string;

	public readonly badges = new SvelteMap<string, Badge>();
	public readonly commands = new SvelteMap<string, Command>();
	public readonly emotes = new ChannelEmoteManager(this);
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

	/**
	 * An array of messages the user has sent in the channel.
	 */
	public history = $state<string[]>([]);
	public messages = $state<Message[]>([]);

	public constructor(
		public readonly client: TwitchApiClient,

		/**
		 * The user for the channel.
		 */
		public readonly user: User,
		stream: Stream | null = null,
	) {
		const now = performance.now();

		this.#lastHitSpdAt = now - RATE_LIMIT_WINDOW * 2;
		this.#lastHitAmtAt = now - RATE_LIMIT_WINDOW * 2;

		this.id = user.id;
		this.stream = stream;

		this.viewers = new ViewerManager(client, this);
	}

	public async join() {
		app.joined = this;
		settings.state.lastJoined = this.ephemeral ? null : this.user.username;

		if (!this.viewers.has(this.id)) {
			const viewer = new Viewer(this, this.user);
			viewer.broadcaster = true;

			this.viewers.set(this.id, viewer);
		}

		const [stream] = await Promise.all([
			this.client.fetchStream(this.id),
			this.emotes.fetch(),
			this.fetchBadges(),
			this.fetchCheermotes(),
		]);

		this.stream = stream;

		this.addCommands(commands);
		this.emotes.addAll(app.emotes.values());

		await invoke("join", {
			id: this.id,
			setId: this.emoteSetId,
			login: this.user.username,
			isMod: app.user?.moderating.has(this.id),
		});

		if (settings.state.chat.history.enabled) {
			await invoke("fetch_recent_messages", {
				channel: this.user.username,
				historyLimit: settings.state.chat.history.limit,
			});
		}
	}

	public async leave() {
		try {
			await invoke("leave", { channel: this.user.username });
		} finally {
			this.reset();
			settings.state.lastJoined = null;
		}
	}

	public addBadges(badges: Badge[]) {
		for (const badge of badges) {
			this.badges.set(`${badge.setID}:${badge.version}`, badge);
		}

		return this;
	}

	public addCommands(commands: Command[]) {
		for (const command of commands) {
			this.commands.set(command.name, command);
		}

		return this;
	}

	public addCheermotes(cheermotes: Cheermote[]) {
		for (const cheermote of cheermotes) {
			this.cheermotes.push(cheermote);
		}

		return this;
	}

	public addMessage(message: Message) {
		if (this.messages.some((m) => m.id === message.id)) {
			return this;
		}

		if (message.recent) {
			if (this.#lastRecentAt === null) {
				this.messages.unshift(message);
				this.#lastRecentAt = 0;
			} else {
				this.messages.splice(this.#lastRecentAt + 1, 0, message);
				this.#lastRecentAt++;
			}
		} else {
			this.messages.push(message);
		}

		return this;
	}

	public reset() {
		this.#bypassNext = false;
		this.#lastRecentAt = null;

		this.history = [];
		this.messages = [];

		this.badges.clear();
		this.emotes.clear();
		this.viewers.clear();
	}

	public clearMessages(id?: string) {
		for (const message of this.messages) {
			if (message.isUser() && (!id || message.author.id === id)) {
				message.deleted = true;
			}
		}
	}

	public async fetchBadges() {
		const { data } = await this.client.get<BadgeSet[]>("/chat/badges", {
			broadcaster_id: this.id,
		});

		for (const badge of data) {
			for (const version of badge.versions) {
				this.badges.set(`${badge.set_id}:${version.id}`, {
					title: version.title,
					description: version.description,
					imageURL: version.image_url_4x,
					setID: badge.set_id,
					version: version.id,
				});
			}
		}
	}

	public async fetchCheermotes() {
		const { data } = await this.client.get<Cheermote[]>("/bits/cheermotes", {
			broadcaster_id: this.id,
		});

		this.cheermotes.push(...data);
		return this.cheermotes;
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

	public async announce(message: string) {
		if (!app.user?.moderating.has(this.id)) {
			return;
		}

		await this.client.post("/chat/announcements", {
			params: {
				broadcaster_id: this.id,
				moderator_id: app.user.id,
			},
			body: {
				message,
			},
		});
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

	public async clearChat() {
		if (!app.user?.moderating.has(this.id)) {
			return;
		}

		await this.client.delete("/moderation/chat", {
			broadcaster_id: this.id,
			moderator_id: app.user.id,
		});
	}

	public async setShieldMode(active = true) {
		if (!app.user?.moderating.has(this.id)) {
			return;
		}

		await this.client.put("/moderation/shield_mode", {
			params: {
				broadcaster_id: this.id,
				moderator_id: app.user.id,
			},
			body: {
				is_active: active,
			},
		});
	}

	public async updateChatSettings(settings: ChatSettings) {
		if (!app.user?.moderating.has(this.id)) {
			return;
		}

		const setSlow = typeof settings.slow === "number" && settings.slow > 0;

		await this.client.patch("/chat/settings", {
			params: {
				broadcaster_id: this.id,
				moderator_id: app.user.id,
			},
			body: {
				emote_mode: settings.emoteOnly ?? false,
				follower_mode: settings.followerOnly ?? false,
				follower_mode_duration: settings.followerOnlyDuration ?? 0,
				subscriber_mode: settings.subOnly ?? false,
				slow_mode: setSlow,
				slow_mode_wait_time: setSlow ? settings.slow : 3,
				unique_mode: settings.unique ?? false,
			},
		});
	}

	public async send(message: string, replyId?: string) {
		if (!app.user) return;

		const viewer = this.viewers.get(app.user.id) ?? new Viewer(this, app.user);
		const elevated = viewer.moderator || viewer.vip;

		if (message.startsWith("/")) {
			const [name, ...args] = message.slice(1).split(" ");

			const command = this.commands.get(name);
			if (!command || (command.modOnly && !viewer.moderator)) return;

			try {
				await command.exec(args, this, viewer.user);
			} catch (error) {
				if (error instanceof Error) {
					log.error(
						`Error executing command ${name} in channel ${this.user.username}: ${error.message}`,
					);
				}

				throw error;
			}

			return;
		}

		const rateLimited = this.#checkRateLimit(elevated);
		if (rateLimited) return;

		if (!elevated && settings.state.chat.bypassDuplicate && this.history.at(-1) === message) {
			this.#bypassNext = !this.#bypassNext;

			if (this.#bypassNext) {
				message = `${message} \u{E0000}`;
			}
		} else {
			this.#bypassNext = false;
		}

		log.info(`Sending message in ${this.user.username} (${this.id})`);

		const {
			data: [data],
		} = await this.client.post<[SentMessage]>("/chat/messages", {
			body: {
				broadcaster_id: this.id,
				sender_id: viewer.id,
				reply_parent_message_id: replyId,
				message,
			},
		});

		if (data.is_sent) {
			log.info("Message sent");
			await invoke("send_presence", { channelId: this.id });
		} else if (data.drop_reason) {
			const reason = data.drop_reason.message;

			log.warn(`Message dropped: ${reason}`);
			this.addMessage(new SystemMessage(reason));
		}
	}

	#checkRateLimit(elevated: boolean) {
		const now = performance.now();

		const queue = elevated ? this.#lastMessageElevated : this.#lastMessage;
		const maxMsgCount = elevated ? 99 : 19;
		const minMsgOffset = elevated ? 100 : 1100;

		const last = queue.at(-1);

		if (last && last + minMsgOffset > now) {
			if (this.#lastHitSpdAt + RATE_LIMIT_WINDOW < now) {
				this.#lastHitSpdAt = now;
			}

			return true;
		}

		while (queue.length && queue[0] + RATE_LIMIT_WINDOW + RATE_LIMIT_GRACE < now) {
			queue.shift();
		}

		if (queue.length >= maxMsgCount) {
			if (this.#lastHitAmtAt + RATE_LIMIT_WINDOW < now) {
				this.#lastHitAmtAt = now;
			}

			return true;
		}

		queue.push(now);
		return false;
	}
}
