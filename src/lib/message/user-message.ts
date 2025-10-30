import { invoke } from "@tauri-apps/api/core";
import { app } from "$lib/state.svelte";
import type { AutoModMetadata, StructuredMessage } from "$lib/twitch/eventsub";
import type { Badge, BasicUser, PrivmsgMessage, UserNoticeMessage } from "$lib/twitch/irc";
import { User } from "$lib/user.svelte";
import { extractEmotes } from "$lib/util";
import { Viewer } from "$lib/viewer.svelte";
import { Message } from "./message.svelte";
import { parse } from ".";
import type { Node } from ".";

function createMinimalUser(sender: BasicUser, color: string) {
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

	if (app.joined) {
		const viewer = new Viewer(app.joined, user);
		app.joined.viewers.set(user.id, viewer);
	}

	return user;
}

/**
 * User messages are either messages received by `PRIVMSG` commands or
 * notifications received by `USERNOTICE` commands.
 */
export class UserMessage extends Message {
	#author: User;
	#viewer?: Viewer;

	#autoMod: AutoModMetadata | null = null;

	#nodes: Node[] = [];

	public constructor(public readonly data: PrivmsgMessage | UserNoticeMessage) {
		super(data);

		const viewer = app.joined?.viewers.get(data.sender.id);

		this.#author = viewer?.user ?? createMinimalUser(data.sender, data.name_color);
		this.#viewer = viewer;
	}

	public static from(message: StructuredMessage, sender: BasicUser) {
		const isAction = /^\x01ACTION.*$/.test(message.text);
		const text = isAction ? message.text.slice(8, -1) : message.text;

		return new this({
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

	public get id() {
		return this.data.message_id;
	}

	public get text() {
		// message_text should only be possibly null if it's a USERNOTICE, in
		// which case we can assume system_message is present
		return this.data.message_text ?? (this.data as UserNoticeMessage).system_message;
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
		if (!app.user || !app.joined) return false;

		const now = Date.now();
		const diff = Math.abs(now - this.timestamp.getTime());

		return (
			app.user.moderating.has(app.joined.user.id) &&
			diff <= 6 * 60 * 60 * 1000 &&
			(app.user.id === this.author.id || !this.viewer?.isMod)
		);
	}

	/**
	 * The user who sent the message.
	 */
	public get author() {
		return this.#author;
	}

	/**
	 * The viewer who sent the message if it was sent in a channel.
	 */
	public get viewer() {
		return this.#viewer ?? null;
	}

	/**
	 * The AutoMod metadata attached to the message if it was caught by AutoMod.
	 */
	public get autoMod() {
		return this.#autoMod;
	}

	/**
	 * The badges sent with the message.
	 */
	public get badges(): Badge[] {
		return this.data.badges;
	}

	/**
	 * The amount of bits sent with the message if it was a cheer.
	 */
	public get bits() {
		return "bits" in this.data ? (this.data.bits ?? 0) : 0;
	}

	/**
	 * Whether channel points were used to highlight the message.
	 */
	public get highlighted() {
		return "is_highlighted" in this.data && this.data.is_highlighted;
	}

	/**
	 * Whether the message is an action i.e. sent with `/me`.
	 */
	public get isAction() {
		return "is_action" in this.data && this.data.is_action;
	}

	/**
	 * Whether the message is the user's first message sent in the channel.
	 */
	public get isFirst() {
		return "is_first_msg" in this.data && this.data.is_first_msg;
	}

	/**
	 * The event associated with the message if it's a `USERNOTICE` message.
	 */
	public get event() {
		return "event" in this.data ? this.data.event : null;
	}

	public get nodes() {
		if (!this.#nodes.length) {
			this.#nodes = parse(this).sort((a, b) => a.start - b.start);
		}

		return this.#nodes;
	}

	/**
	 * The metadata for the parent and thread starter messages if the message
	 * is a reply.
	 */
	public get reply() {
		return "reply" in this.data ? this.data.reply : null;
	}

	public async delete() {
		if (!app.user || !app.joined) return;

		await invoke("delete_message", {
			broadcasterId: app.joined.user.id,
			messageId: this.id,
		});
	}

	public setAutoMod(metadata: AutoModMetadata) {
		this.#autoMod = metadata;
		return this;
	}
}
