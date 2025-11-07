import { betterFetch as fetch } from "@better-fetch/fetch";
import { SvelteMap } from "svelte/reactivity";
import type { Channel } from "$lib/channel.svelte";
import { transform7tvEmote, transformBttvEmote, transformFfzEmote } from "$lib/emotes";
import type { BttvEmote, Emote, FfzEmoteSet } from "$lib/emotes";
import { ApiError } from "$lib/errors";
import { emoteSetDetailsFragment, seventvGql as gql, send7tv as send } from "$lib/graphql";
import type { EmoteProviderOptions } from "./emote-manager";

interface Room {
	room: { set: number };
	sets: Record<number, FfzEmoteSet>;
}

interface BttvUser {
	channelEmotes: BttvEmote[];
	sharedEmotes: BttvEmote[];
}

export class ChannelEmoteManager extends SvelteMap<string, Emote> {
	public constructor(public readonly channel: Channel) {
		super();
	}

	public addAll(emotes: Iterable<Emote>) {
		for (const emote of emotes) {
			this.set(emote.name, emote);
		}

		return this;
	}

	/**
	 * Retrieves the list of emotes in the channel from the specified providers
	 * (FFZ, BTTV, and 7TV by default) and caches them for later use.
	 */
	public fetch(options: EmoteProviderOptions = { ffz: true, bttv: true, seventv: true }) {
		const promises: Promise<Emote[]>[] = [];

		if (options.ffz) {
			promises.push(this.fetchFfz());
		}

		if (options.bttv) {
			promises.push(this.fetchBttv());
		}

		if (options.seventv) {
			promises.push(this.fetchActiveSet());
		}

		return Promise.all(promises);
	}

	/**
	 * Retrieves the list of FrankerFaceZ emotes in the channel.
	 */
	public async fetchFfz() {
		const { data, error } = await fetch<Room>(
			`https://api.frankerfacez.com/v1/room/id/${this.channel.id}`,
		);

		if (error) {
			if (error.status === 404) {
				return [];
			}

			throw new ApiError(error.status, error.statusText);
		}

		const emotes = data.sets[data.room.set].emoticons.map(transformFfzEmote);
		this.addAll(emotes);

		return emotes;
	}

	/**
	 * Retrieves the list of BetterTTV emotes in the channel.
	 */
	public async fetchBttv() {
		const { data, error } = await fetch<BttvUser>(
			`https://api.betterttv.net/3/cached/users/twitch/${this.channel.id}`,
		);

		if (error) {
			throw new ApiError(error.status, error.statusText);
		}

		const emotes = data.channelEmotes.concat(data.sharedEmotes).map(transformBttvEmote);
		this.addAll(emotes);

		return emotes;
	}

	/**
	 * Retrieves the active 7TV emote set for the channel.
	 */
	public async fetchActiveSet() {
		const { users } = await send(
			gql(
				`query GetActiveEmoteSet($id: String!) {
					users {
						userByConnection(platform: TWITCH, platformId: $id) {
							style {
								activeEmoteSet {
									...EmoteSetDetails
								}
							}
						}
					}
				}`,
				[emoteSetDetailsFragment],
			),
			{ id: this.channel.id },
		);

		if (!users.userByConnection || !users.userByConnection.style.activeEmoteSet) {
			return [];
		}

		const set = users.userByConnection.style.activeEmoteSet;
		this.channel.emoteSetId = set.id;

		const emotes = set.emotes.items.map((item) => transform7tvEmote(item.emote));
		this.addAll(emotes);

		return emotes;
	}
}
