import { betterFetch as fetch } from "@better-fetch/fetch";
import * as cache from "tauri-plugin-cache-api";
import { transform7tvEmote, transformBttvEmote, transformFfzEmote } from "$lib/emotes";
import type { BttvEmote, Emote, FfzEmoteSet } from "$lib/emotes";
import { ApiError } from "$lib/errors/api-error";
import { send7tv as send } from "$lib/graphql";
import { emoteSetDetailsFragment } from "$lib/graphql/fragments";
import { seventvGql as gql } from "$lib/graphql/function";
import type { Channel } from "$lib/models/channel.svelte";
import { BaseEmoteManager } from "./base-emote-manager";

interface Room {
	room: { set: number };
	sets: Record<number, FfzEmoteSet>;
}

interface BttvUser {
	channelEmotes: BttvEmote[];
	sharedEmotes: BttvEmote[];
}

export class ChannelEmoteManager extends BaseEmoteManager {
	public constructor(public readonly channel: Channel) {
		super();
	}

	public override async fetch() {
		let emotes = await cache.get<Emote[]>("global_emotes");

		if (!emotes) {
			emotes = await super.fetch();
			await cache.set(`emotes:${this.channel.id}`, emotes);
		} else {
			this.addAll(emotes);
		}

		return emotes;
	}

	/**
	 * Retrieves the list of FrankerFaceZ emotes in the channel.
	 */
	public override async fetchFfz() {
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
	public override async fetchBttv() {
		const { data, error } = await fetch<BttvUser>(
			`https://api.betterttv.net/3/cached/users/twitch/${this.channel.id}`,
		);

		if (error) {
			if (error.status === 404) {
				return [];
			}

			throw new ApiError(error.status, error.statusText);
		}

		const emotes = data.channelEmotes.concat(data.sharedEmotes).map(transformBttvEmote);
		this.addAll(emotes);

		return emotes;
	}

	/**
	 * Retrieves the active 7TV emote set for the channel.
	 */
	public override async fetch7tv() {
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

		const emotes = set.emotes.items.map((item) => transform7tvEmote(item.emote, item.alias));
		this.addAll(emotes);

		return emotes;
	}
}
