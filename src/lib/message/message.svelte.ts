import type { BaseUserMessage } from "$lib/twitch/irc";
import type { SystemMessage, SystemMessageData, UserMessage } from ".";

export type MessageData = BaseUserMessage | SystemMessageData;

export abstract class Message {
	readonly #system: boolean;

	/**
	 * The id (stored as a UUID) of the message.
	 */
	public abstract readonly id: string;

	/**
	 * The text content of the message.
	 */
	public abstract text: string;

	/**
	 * The timestamp at which the message was sent at.
	 */
	public readonly timestamp: Date;

	/**
	 * Whether the message has been deleted.
	 */
	public deleted = $state(false);

	/**
	 * Whether the message was retreived by the `recent-messages` API.
	 */
	public recent: boolean;

	public constructor(
		public readonly data: MessageData,
		system = false,
	) {
		this.#system = system;

		this.timestamp = new Date(this.data.server_timestamp);
		this.deleted = data.deleted;
		this.recent = data.is_recent;
	}

	public isSystem(): this is SystemMessage {
		return this.#system;
	}

	public isUser(): this is UserMessage {
		return !this.#system;
	}
}
