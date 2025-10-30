import { SvelteMap } from "svelte/reactivity";
import { settings } from "./settings";
import { makeReadable } from "./util";
import type { Paint } from "./seventv";
import type { UserWithColor } from "./tauri";
import type { Badge, User as HelixUser } from "./twitch/api";

export interface PartialUser {
	id: string;
	color?: string;
	username: string;
	displayName: string;
}

const requests = new Map<string, Promise<User>>();

export class User implements PartialUser {
	readonly #data: HelixUser;

	#color: string | null = null;
	#username: string;
	#displayName: string;

	/**
	 * The 7TV badge for the user if they have one set.
	 */
	public badge = $state<Badge>();

	/**
	 * The 7TV paint for the user if they have one set.
	 */
	public paint = $state<Paint>();

	/**
	 * A map of channel ids to usernames that the user is a moderator in. This will
	 * always include the user's own id, and will only include other ids for
	 * the current user.
	 */
	public readonly moderating = new SvelteMap<string, string>();

	public constructor(data: UserWithColor) {
		this.#data = data.data;

		this.#username = this.#data.login;
		this.#displayName = this.#data.display_name;
		this.#color = data.color;

		this.moderating.set(this.id, this.username);
	}

	public get id() {
		return this.#data.id;
	}

	/**
	 * The date the user's account was created.
	 */
	public get createdAt() {
		return new Date(this.#data.created_at);
	}

	/**
	 * The color of the user's name. Defaults to the current foreground color
	 * if the user doesn't have a color set.
	 */
	public get color() {
		if (this.#color && settings.state.chat.readableColors) {
			return makeReadable(this.#color);
		}

		return this.#color ?? "inherit";
	}

	/**
	 * The CSS style for the user's name.
	 */
	public get style() {
		const color = `color: ${this.color};`;

		return this.paint ? `${this.paint.css}; ${color}` : color;
	}

	public get username() {
		return this.#username;
	}

	/**
	 * The display name of the user. The capitalization may differ from the
	 * username.
	 *
	 * If the user has a localized name and localized names are enabled in
	 * settings, this will be the localized name followed by the username in
	 * parentheses.
	 */
	public get displayName() {
		if (settings.state.chat.localizedNames && this.localizedName) {
			return `${this.localizedName} (${this.username})`;
		}

		return this.#displayName;
	}

	/**
	 * The localized display name of the user if they have their Twitch
	 * language set to Chinese, Japanese, or Korean.
	 */
	public get localizedName() {
		return this.#username !== this.#displayName.toLowerCase() ? this.#displayName : null;
	}

	public get bio() {
		return this.#data.description;
	}

	public get avatarUrl() {
		return this.#data.profile_image_url;
	}

	public get bannerUrl() {
		return this.#data.offline_image_url;
	}

	/**
	 * Whether the user is Twitch staff.
	 */
	public get isStaff() {
		return this.#data.type === "staff";
	}

	/**
	 * Whether the user is a Twitch affiliate.
	 */
	public get isAffiliate() {
		return this.#data.broadcaster_type === "affiliate";
	}

	/**
	 * Whether the user is a Twitch partner.
	 */
	public get isPartner() {
		return this.#data.broadcaster_type === "partner";
	}

	public setColor(color: string | null) {
		this.#color = color;
		return this;
	}

	public setUsername(username: string) {
		this.#username = username;
		return this;
	}

	public setDisplayName(displayName: string) {
		this.#displayName = displayName;
		return this;
	}
}
