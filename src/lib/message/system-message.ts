import { Message } from "./message.svelte";
import type { MessageContext } from "./context";

export interface SystemMessageData {
	deleted: boolean;
	is_recent: boolean;
	server_timestamp: number;
}

/**
 * System messages are messages constructed internally and sent to relay
 * information to the user.
 */
export class SystemMessage extends Message {
	#id = crypto.randomUUID();
	#text = "";

	#context: MessageContext | null = null;

	public constructor(data: Partial<SystemMessageData> = {}) {
		const prepared: SystemMessageData = {
			deleted: data.deleted ?? false,
			is_recent: data.is_recent ?? false,
			server_timestamp: data.server_timestamp ?? Date.now(),
		};

		super(prepared, true);
	}

	public static fromContext(context: MessageContext) {
		const message = new this();
		return message.setContext(context);
	}

	/**
	 * The id (stored as a UUID) of the message.
	 */
	public override get id() {
		return this.#id;
	}

	/**
	 * The text content of the message.
	 */
	public override get text() {
		return this.#text;
	}

	/**
	 * The context associated with the message.
	 */
	public get context() {
		return this.#context;
	}

	public setContext(context: MessageContext) {
		this.#context = context;
		return this;
	}

	public setText(text: string) {
		this.#text = text;
		return this;
	}
}
