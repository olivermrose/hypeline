import { betterFetch as fetch } from "@better-fetch/fetch";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import { app } from "$lib/app.svelte";
import { ApiError } from "$lib/errors/api-error";
import { badgeDetailsFragment } from "$lib/graphql/fragments";
import type { Badge } from "$lib/graphql/fragments";
import { twitchGql as gql } from "$lib/graphql/function";
import type { User as ApiUser } from "$lib/graphql/queries";
import { settings } from "$lib/settings";
import type { Paint } from "$lib/seventv";
import type { SubscriptionAge } from "$lib/twitch/api";
import type { TwitchClient } from "$lib/twitch/client";
import { dedupe, makeReadable } from "$lib/util";
import type { Whisper } from "./whisper.svelte";

export interface RelationshipSubscription {
	/**
	 * Whether the user has their subscription info hidden.
	 */
	hidden: boolean;

	/**
	 * The type of subscription the user has in the channel.
	 */
	type: "prime" | "paid" | "gift" | null;

	/**
	 * The tier of the subscription the user has in the channel.
	 */
	tier: string | null;

	/**
	 * The number of months the user has been subscribed to the channel.
	 */
	months: number | null;
}

/**
 * Represents a user's relationship to a channel.
 */
export interface Relationship {
	/**
	 * The badges the user has in the channel along with global badges earned.
	 */
	badges: Badge[];

	/**
	 * The date the user followed the channel if they follow it.
	 */
	followedAt: Date | null;

	/**
	 * Metadata for the user's subscription to the channel if they are subscribed.
	 */
	subscription: RelationshipSubscription;
}

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
	public createdAt: Date;

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
	public bio: string;

	/**
	 * The url of the user's avatar image.
	 */
	public avatarUrl: string;

	/**
	 * The url of the user's banner image seen when they are offline.
	 */
	public bannerUrl: string;

	/**
	 * The ids of the channels the current user moderates for.
	 */
	public readonly moderating = new SvelteSet<string>();

	/**
	 * The relationships of the user to other channels.
	 */
	public readonly relationships = new SvelteMap<string, Relationship>();

	/**
	 * The whisper threads the user is involved in.
	 */
	public readonly whispers = new SvelteMap<string, Whisper>();

	/**
	 * The username of the user.
	 */
	public username: string;

	/**
	 * The 7TV badge for the user if they have one set.
	 */
	public readonly badge?: Badge;

	/**
	 * The 7TV paint for the user if they have one set.
	 */
	public readonly paint?: Paint;

	public constructor(
		public readonly client: TwitchClient,
		data: ApiUser,
	) {
		this.#color = data.chatColor;
		this.#displayName = data.displayName;

		this.id = data.id;
		this.username = data.login;

		// WebKit and V8 behavior differ when instantiating a date with 0 as a string
		this.createdAt = new Date(data.createdAt === "0" ? 0 : data.createdAt);

		this.staff = data.roles?.isStaff ?? false;
		this.affiliated = data.roles?.isAffiliate ?? false;
		this.partnered = data.roles?.isPartner ?? false;

		this.bio = data.description ?? "";
		this.avatarUrl = data.profileImageURL ?? "";
		this.bannerUrl = data.bannerImageURL ?? "";

		this.badge = $derived(app.u2b.get(this.id));
		this.paint = $derived(app.u2p.get(this.id));

		this.moderating.add(data.id);
	}

	/**
	 * The color of the user's name. Defaults to the current foreground color
	 * if the user doesn't have a color set.
	 */
	public get color() {
		if (this.#color && settings.state.chat.usernames.readable) {
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
		if (settings.state.chat.usernames.localized && this.localizedName) {
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

	public get partial() {
		return this.createdAt.getUTCFullYear() === 1970;
	}

	public async fetch() {
		await this.client.users.fetch(this.id, { force: true });

		const cached = this.client.users.get(this.id);
		if (!cached) return this;

		this.createdAt = cached.createdAt;
		this.bio = cached.bio;
		this.avatarUrl = cached.avatarUrl;
		this.bannerUrl = cached.bannerUrl;

		return this;
	}

	/**
	 * Retrieves the user's relationship to the specified channel.
	 */
	public async fetchRelationship(channel: string) {
		const rel = this.relationships.get(channel);
		if (rel) return rel;

		const gqlRequest = this.client.send(
			gql(
				`query GetUserBadges($user: String!, $channel: String!) {
					channelViewer(userLogin: $user, channelLogin: $channel) {
						earnedBadges {
							...BadgeDetails
						}
					}
				}`,
				[badgeDetailsFragment],
			),
			{ user: this.username, channel },
		);

		const params = `${this.username}/${channel}`;
		const ivrRequest = dedupe(`ivr:${params}`, () =>
			fetch<SubscriptionAge>(`https://api.ivr.fi/v2/twitch/subage/${params}`),
		);

		const [{ channelViewer }, { data, error }] = await Promise.all([gqlRequest, ivrRequest]);

		if (error) {
			throw new ApiError(error.status, error.statusText);
		}

		const relationship = {
			badges: channelViewer?.earnedBadges ?? [],
			followedAt: data.followedAt ? new Date(data.followedAt) : null,
			subscription: {
				hidden: data.statusHidden,
				type: data.meta?.type ?? null,
				tier: data.meta?.tier ?? null,
				months: data.cumulative?.months ?? null,
			},
		};

		this.relationships.set(channel, relationship);
		return relationship;
	}
}
