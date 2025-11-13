import type { Badge } from "$lib/graphql";
import type { User } from "./user.svelte";

export interface WhisperMessage {
	id: string;
	createdAt: Date;
	badges: Badge[];
	user: User;
	text: string;
}

export class Whisper {
	/**
	 * The messages in the whisper.
	 */
	public readonly messages = $state<WhisperMessage[]>([]);

	/**
	 * The most recently sent message in the whisper.
	 */
	public readonly latest = $derived(this.messages.at(-1));

	/**
	 * The number of unread messages in the whisper.
	 */
	public unread = $state<number>(0);
}
