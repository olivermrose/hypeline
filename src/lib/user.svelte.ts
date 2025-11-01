import { SvelteMap } from "svelte/reactivity";
import { settings } from "./settings";
import { makeReadable } from "./util";
import type { Paint } from "./seventv";
import type { UserWithColor } from "./tauri";
import type { Badge, User as HelixUser } from "./twitch/api";

export interface PartialUser {
	id: string;
	color?: string | null;
	username: string;
	displayName: string;
}

export class User implements PartialUser {
	readonly #data: HelixUser;

	#color: string | null = null;
	#displayName: string;

	public readonly id: string;

	/**
	 * The date the user's account was created.
	 */
	public readonly createdAt: Date;

	/**
	 * Whether the user is Twitch staff.
	 */
	public readonly staff: boolean;

	/**
	 * Whether the user is a Twitch affiliate.
	 */
	public readonly affiliated: boolean;

	/**
	 * Whether the user is a Twitch partner.
	 */
	public readonly partnered: boolean;

	/**
	 * The bio of the user.
	 */
	public readonly bio: string;

	/**
	 * The URL of the user's avatar image.
	 */
	public readonly avatarUrl: string;

	/**
	 * The URL of the user's banner image seen when they are offline.
	 */
	public readonly bannerUrl: string;

	/**
	 * The username of the user.
	 */
	public username: string;

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

		this.#color = data.color;
		this.#displayName = this.#data.display_name;

		this.id = this.#data.id;
		this.username = this.#data.login;
		this.createdAt = new Date(this.#data.created_at);

		this.staff = this.#data.type === "staff";
		this.affiliated = this.#data.broadcaster_type === "affiliate";
		this.partnered = this.#data.broadcaster_type === "partner";

		this.bio = this.#data.description;
		this.avatarUrl = this.#data.profile_image_url;
		this.bannerUrl = this.#data.offline_image_url;

		this.moderating.set(this.id, this.username);
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

	public set color(color: string | null) {
		this.#color = color;
	}

	/**
	 * The CSS style for the user's name.
	 */
	public get style() {
		const color = `color: ${this.color};`;

		return this.paint ? `${this.paint.css}; ${color}` : color;
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

	public set displayName(displayName: string) {
		this.#displayName = displayName;
	}

	/**
	 * The localized display name of the user if they have their Twitch
	 * language set to Chinese, Japanese, or Korean.
	 */
	public get localizedName() {
		return this.username !== this.#displayName.toLowerCase() ? this.#displayName : null;
	}
}
