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
	public override readonly id = crypto.randomUUID();
	public override text = "";

	/**
	 * The context associated with the message.
	 */
	public context: MessageContext | null = null;

	public constructor(data?: string | Partial<SystemMessageData>) {
		data = typeof data === "string" ? undefined : (data ?? {});

		super(
			{
				deleted: data?.deleted ?? false,
				is_recent: data?.is_recent ?? false,
				server_timestamp: data?.server_timestamp ?? Date.now(),
			},
			true,
		);

		if (typeof data === "string") {
			this.text = data;
		}
	}

	public static fromContext(context: MessageContext) {
		const message = new this();
		message.context = context;

		return message;
	}
}
