import { invoke } from "@tauri-apps/api/core";
import type { Channel } from "$lib/channel.svelte";
import { app } from "$lib/state.svelte";
import type { AutoModMetadata, StructuredMessage } from "$lib/twitch/eventsub";
import type {
	Badge,
	BasicUser,
	PrivmsgMessage,
	Reply,
	UserNoticeEvent,
	UserNoticeMessage,
} from "$lib/twitch/irc";
import { User } from "$lib/user.svelte";
import { extractEmotes } from "$lib/util";
import { Viewer } from "$lib/viewer.svelte";
import { Message } from "./message.svelte";
import { parse } from ".";
import type { Node } from ".";

function createMinimalUser(channel: Channel, sender: BasicUser, color: string) {
	const user = new User({
		data: {
			id: sender.id,
			created_at: "0",
			login: sender.login,
			display_name: sender.name,
			description: "",
			profile_image_url: "",
			offline_image_url: "",
			type: "",
			broadcaster_type: "",
		},
		color: color ?? null,
	});

	const viewer = new Viewer(channel, user);
	channel.viewers.set(user.id, viewer);

	return user;
}

/**
 * User messages are either messages received by `PRIVMSG` commands or
 * notifications received by `USERNOTICE` commands.
 */
export class UserMessage extends Message {
	#nodes: Node[] = [];

	public override readonly id: string;
	public override readonly text: string;

	/**
	 * The user who sent the message.
	 */
	public readonly author: User;

	/**
	 * The viewer who sent the message if it was sent in a channel.
	 */
	public readonly viewer: Viewer | null = null;

	/**
	 * Whether the message is an action i.e. sent with `/me`.
	 */
	public readonly action: boolean;

	/**
	 * Whether channel points were used to highlight the message.
	 */
	public readonly highlighted: boolean;

	/**
	 * The badges sent with the message.
	 */
	public readonly badges: Badge[];

	/**
	 * The amount of bits sent with the message if it was a cheer.
	 */
	public readonly bits: number;

	/**
	 * The event associated with the message if it's a `USERNOTICE` message.
	 */
	public readonly event: UserNoticeEvent | null;

	/**
	 * The metadata for the parent and thread starter messages if the message
	 * is a reply.
	 */
	public readonly reply: Reply | null;

	/**
	 * The AutoMod metadata attached to the message if it was caught by AutoMod.
	 */
	public autoMod: AutoModMetadata | null = null;

	public constructor(
		/**
		 * The channel the message was sent in.
		 */
		public readonly channel: Channel,
		public readonly data: PrivmsgMessage | UserNoticeMessage,
	) {
		super(data);

		const viewer = channel.viewers.get(data.sender.id);

		this.id = data.message_id;

		// message_text should only be possibly null if it's a USERNOTICE, in
		// which case we can assume system_message is present
		this.text = data.message_text ?? (data as UserNoticeMessage).system_message;

		this.author = viewer?.user ?? createMinimalUser(channel, data.sender, data.name_color);
		this.viewer = viewer ?? null;

		this.action = "is_action" in data && data.is_action;
		this.highlighted = "is_highlighted" in data && data.is_highlighted;

		this.badges = data.badges;
		this.bits = "bits" in data ? (data.bits ?? 0) : 0;
		this.event = "event" in data ? data.event : null;
		this.reply = "reply" in data ? data.reply : null;
	}

	public static from(channel: Channel, message: StructuredMessage, sender: BasicUser) {
		const isAction = /^\x01ACTION.*$/.test(message.text);
		const text = isAction ? message.text.slice(8, -1) : message.text;

		return new this(channel, {
			type: "privmsg",
			badge_info: [],
			badges: [],
			bits: message.fragments.reduce((a, b) => {
				return a + (b.type === "cheermote" ? b.cheermote.bits : 0);
			}, 0),
			channel_id: "",
			channel_login: "",
			deleted: false,
			emotes: extractEmotes(message.fragments),
			message_id: message.message_id,
			message_text: text,
			name_color: "",
			is_action: isAction,
			is_first_msg: false,
			is_highlighted: false,
			is_mod: false,
			is_subscriber: false,
			is_recent: false,
			is_returning_chatter: false,
			reply: null,
			sender,
			server_timestamp: Date.now(),
		});
	}

	/**
	 * Whether the current user can perform mod actions on the message.
	 *
	 * A message is considered actionable if they are a mod in the channel, the
	 * message is less than six hours old, and one of the following is true:
	 *
	 * 1. It is their own message
	 * 2. It is a message that is not sent by the broadcaster or another
	 * moderator
	 */
	public get actionable() {
		if (!app.user) return false;

		const now = Date.now();
		const diff = Math.abs(now - this.timestamp.getTime());

		return (
			app.user.moderating.has(this.channel.id) &&
			diff <= 6 * 60 * 60 * 1000 &&
			(app.user.id === this.author.id || !this.viewer?.moderator)
		);
	}

	public get nodes() {
		if (!this.#nodes.length) {
			this.#nodes = parse(this).sort((a, b) => a.start - b.start);
		}

		return this.#nodes;
	}

	public async delete() {
		if (!app.user) return;

		await invoke("delete_message", {
			broadcasterId: this.channel.id,
			messageId: this.id,
		});
	}
}
