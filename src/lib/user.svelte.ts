import { SvelteSet } from "svelte/reactivity";
import { settings } from "./settings";
import { makeReadable } from "./util";
import type { User as ApiUser, Badge } from "./graphql";
import type { Paint } from "./seventv";

export interface PartialUser {
	id: string;
	color?: string | null;
	username: string;
	displayName: string;
}

export class User implements PartialUser {
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
	 * The url of the user's avatar image.
	 */
	public readonly avatarUrl: string;

	/**
	 * The url of the user's banner image seen when they are offline.
	 */
	public readonly bannerUrl: string;

	/**
	 * The ids of the channels the current user moderates for.
	 */
	public readonly moderating = new SvelteSet<string>();

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

	public constructor(data: ApiUser) {
		this.#color = data.chatColor;
		this.#displayName = data.displayName;

		this.id = data.id;
		this.username = data.login;
		this.createdAt = new Date(data.createdAt);

		this.staff = data.roles?.isStaff ?? false;
		this.affiliated = data.roles?.isAffiliate ?? false;
		this.partnered = data.roles?.isPartner ?? false;

		this.bio = data.description ?? "";
		this.avatarUrl = data.profileImageURL ?? "";
		this.bannerUrl = data.bannerImageURL ?? "";

		this.moderating.add(data.id);
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
