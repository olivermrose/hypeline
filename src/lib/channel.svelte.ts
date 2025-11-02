import { invoke } from "@tauri-apps/api/core";
import { SvelteMap } from "svelte/reactivity";
import { PUBLIC_TWITCH_CLIENT_ID } from "$env/static/public";
import { log } from "./log";
import { SystemMessage } from "./message";
import { settings } from "./settings";
import { app } from "./state.svelte";
import { ViewerManager } from "./viewer-manager";
import { Viewer } from "./viewer.svelte";
import type { Command } from "./commands/util";
import type { Message } from "./message";
import type { EmoteSet } from "./seventv";
import type { Emote } from "./tauri";
import type { Badge, BadgeSet, Cheermote, Stream } from "./twitch/api";
import type { User } from "./user.svelte";

const RATE_LIMIT_WINDOW = 30 * 1000;
const RATE_LIMIT_GRACE = 1000;

export class Channel {
	#bypassNext = false;
	#lastRecentAt: number | null = null;

	#lastMessage: number[] = [];
	#lastMessageElevated: number[] = [];
	#lastHitSpdAt: number;
	#lastHitAmtAt: number;

	public readonly id: string;

	public readonly badges = new SvelteMap<string, Record<string, Badge>>();
	public readonly commands = new SvelteMap<string, Command>();
	public readonly emotes = new SvelteMap<string, Emote>();
	public readonly cheermotes = $state<Cheermote[]>([]);

	/**
	 * The viewers in the channel.
	 */
	public readonly viewers = new ViewerManager(this);

	/**
	 * The stream associated with the channel if it's currently live.
	 */
	public stream = $state<Stream | null>(null);

	/**
	 * Whether the channel is ephemeral.
	 */
	public ephemeral = false;

	/**
	 * The active 7TV emote set for the channel if any.
	 */
	public emoteSet = $state<EmoteSet>();

	/**
	 * An array of messages the user has sent in the channel.
	 */
	public history = $state<string[]>([]);
	public messages = $state<Message[]>([]);

	/**
	 * The error message from the last failed command if any.
	 */
	public error = $state<string>("");

	public constructor(
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
	}

	public async leave() {
		await invoke("leave", { channel: this.user.username });

		settings.state.lastJoined = null;
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

	public addEmotes(emotes: Record<string, Emote> | Map<string, Emote>) {
		const entries = emotes instanceof Map ? emotes : Object.entries(emotes);

		for (const [name, emote] of entries) {
			this.emotes.set(name, emote);
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

	public async raid(to: string) {
		await invoke("raid", { fromId: this.user.id, toId: to });
	}

	public async unraid() {
		await invoke("cancel_raid", { broadcasterId: this.user.id });
	}

	public shoutout(to: string) {
		return invoke("shoutout", { fromId: this.user.id, toId: to });
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
				log.error(
					`Error executing command ${name} in channel ${this.user.username}: ${error}`,
				);

				this.error = "An unknown error occurred while trying to execute command.";
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

		log.info(`Sending message in ${this.user.username} (${this.user.id})`);

		const response = await fetch("https://api.twitch.tv/helix/chat/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Client-ID": PUBLIC_TWITCH_CLIENT_ID,
				Authorization: `Bearer ${settings.state.user?.token}`,
			},
			body: JSON.stringify({
				broadcaster_id: this.user.id,
				sender_id: viewer.id,
				reply_parent_message_id: replyId,
				message,
			}),
		});

		const body = await response.json();

		if (body.status === 429) {
			log.warn(`Rate limit exceeded: ${body.message}`);
			this.addMessage(new SystemMessage(body.message));
		} else if (response.ok) {
			if (body.data[0].is_sent) {
				log.info("Message sent");
				await invoke("send_presence", { channelId: this.user.id });
			} else {
				const reason = body.data[0].drop_reason.message;

				log.warn(`Message dropped: ${reason}`);
				this.addMessage(new SystemMessage(reason));
			}
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
