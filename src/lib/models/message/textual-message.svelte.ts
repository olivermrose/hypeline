import type { BaseUserMessage } from "$lib/twitch/irc";
import type { Channel } from "../channel.svelte";
import { Message } from "./message";
import type { SystemMessageData } from "./system-message";

export type MessageData = BaseUserMessage | SystemMessageData;

export abstract class TextualMessage extends Message {
	public abstract readonly id: string;

	/**
	 * The text content of the message.
	 */
	public abstract text: string;

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
		/**
		 * The channel the message was sent in.
		 */
		public readonly channel: Channel,
		public readonly data: MessageData,
	) {
		super();

		this.timestamp = new Date(this.data.server_timestamp);
		this.deleted = data.deleted;
		this.recent = data.is_recent;
	}
}
