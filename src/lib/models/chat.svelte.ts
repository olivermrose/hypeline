import { invoke } from "@tauri-apps/api/core";
import { app } from "$lib/app.svelte";
import type { Command } from "$lib/commands";
import { log } from "$lib/log";
import { settings } from "$lib/settings";
import type { SentMessage } from "$lib/twitch/api";
import { commands } from "../commands";
import { SystemMessage } from "./message/system-message";
import { Viewer } from "./viewer.svelte";
import type { Channel } from "./channel.svelte";
import type { Message } from "./message/message.svelte";

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

export class Chat {
	#bypassNext = false;
	#lastRecentAt: number | null = null;

	// Timestamps of last messages sent by normal/elevated users.
	#lastMessage: number[] = [];
	#lastMessageElevated: number[] = [];

	// Timestamps of the last rate limit hits by speed/amount.
	#lastHitSpdAt: number;
	#lastHitAmtAt: number;

	/**
	 * The commands available in the chat.
	 */
	public readonly commands = new Map<string, Command>();

	/**
	 * An array of messages sent in the chat.
	 */
	public messages = $state<Message[]>([]);

	/**
	 * An array of messages the current user has sent in the chat.
	 */
	public history: string[] = [];

	public constructor(public readonly channel: Channel) {
		const now = performance.now();

		this.#lastHitSpdAt = now - RATE_LIMIT_WINDOW * 2;
		this.#lastHitAmtAt = now - RATE_LIMIT_WINDOW * 2;

		this.addCommands(commands);
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

	public addCommands(commands: Command[]) {
		for (const command of commands) {
			this.commands.set(command.name, command);
		}

		return this;
	}

	public deleteMessages(id?: string) {
		for (const message of this.messages) {
			if (message.isUser() && (!id || message.author.id === id)) {
				message.deleted = true;
			}
		}
	}

	public async clear() {
		if (!app.user?.moderating.has(this.channel.id)) {
			return;
		}

		await this.channel.client.delete("/moderation/chat", {
			broadcaster_id: this.channel.id,
			moderator_id: app.user.id,
		});
	}

	public reset() {
		this.#bypassNext = false;
		this.#lastRecentAt = null;
		this.messages = [];
		this.history = [];
	}

	public async setShieldMode(active = true) {
		if (!app.user?.moderating.has(this.channel.id)) {
			return;
		}

		await this.channel.client.put("/moderation/shield_mode", {
			params: {
				broadcaster_id: this.channel.id,
				moderator_id: app.user.id,
			},
			body: {
				is_active: active,
			},
		});
	}

	public async updateSettings(settings: ChatSettings) {
		if (!app.user?.moderating.has(this.channel.id)) {
			return;
		}

		const setSlow = typeof settings.slow === "number" && settings.slow > 0;

		await this.channel.client.patch("/chat/settings", {
			params: {
				broadcaster_id: this.channel.id,
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

		const viewer = this.channel.viewers.get(app.user.id) ?? new Viewer(this.channel, app.user);
		const elevated = viewer.moderator || viewer.vip;

		if (message.startsWith("/")) {
			const [name, ...args] = message.slice(1).split(" ");

			const command = this.commands.get(name);
			if (!command || (command.modOnly && !viewer.moderator)) return;

			try {
				await command.exec(args, this.channel, viewer.user);
			} catch (error) {
				if (error instanceof Error) {
					log.error(
						`Error executing command ${name} in channel ${this.channel.user.username}: ${error.message}`,
					);
				}

				throw error;
			}

			return;
		}

		const rateLimited = this.#checkRateLimit(elevated);
		if (rateLimited) return;

		if (
			!elevated &&
			settings.state.chat.messages.duplicateBypass &&
			this.history.at(-1) === message
		) {
			this.#bypassNext = !this.#bypassNext;

			if (this.#bypassNext) {
				message = `${message} \u{E0000}`;
			}
		} else {
			this.#bypassNext = false;
		}

		log.info(`Sending message in ${this.channel.user.username} (${this.channel.id})`);

		const {
			data: [data],
		} = await this.channel.client.post<[SentMessage]>("/chat/messages", {
			body: {
				broadcaster_id: this.channel.id,
				sender_id: viewer.id,
				reply_parent_message_id: replyId,
				message,
			},
		});

		if (data.is_sent) {
			log.info("Message sent");
			await invoke("send_presence", { channelId: this.channel.id });
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
