import { betterFetch as fetch } from "@better-fetch/fetch";
import { transform7tvEmote, transformBttvEmote, transformFfzEmote } from "$lib/emotes";
import type { BttvEmote, GlobalSet } from "$lib/emotes";
import { ApiError } from "$lib/errors/api-error";
import { send7tv as send } from "$lib/graphql";
import { emoteSetDetailsFragment } from "$lib/graphql/fragments";
import { seventvGql as gql } from "$lib/graphql/function";
import { BaseEmoteManager } from "./base-emote-manager";

export class EmoteManager extends BaseEmoteManager {
	/**
	 * Retrieves the list of global FrankerFaceZ emotes.
	 */
	public override async fetchFfz() {
		const { data, error } = await fetch<GlobalSet>(
			"https://api.frankerfacez.com/v1/set/global",
		);

		if (error) {
			throw new ApiError(error.status, error.statusText);
		}

		// 3 is the global set id
		const emotes = data.sets[3].emoticons.map((emote) => ({
			global: true,
			...transformFfzEmote(emote),
		}));

		this.addAll(emotes);
		return emotes;
	}

	/**
	 * Retrieves the list of global BetterTTV emotes.
	 */
	public override async fetchBttv() {
		const { data, error } = await fetch<BttvEmote[]>(
			"https://api.betterttv.net/3/cached/emotes/global",
		);

		if (error) {
			throw new ApiError(error.status, error.statusText);
		}

		const emotes = data.map((emote) => ({
			global: true,
			...transformBttvEmote(emote),
		}));

		this.addAll(emotes);
		return emotes;
	}

	/**
	 * Retrieves the list of global 7TV emotes.
	 */
	public override async fetch7tv() {
		const { emoteSets } = await send(
			gql(
				`query {
					emoteSets {
						emoteSet(id: "01HKQT8EWR000ESSWF3625XCS4") {
							...EmoteSetDetails
						}
					}
				}`,
				[emoteSetDetailsFragment],
			),
		);

		const emotes = emoteSets.emoteSet!.emotes.items.map((item) => ({
			global: true,
			...transform7tvEmote(item.emote),
		}));

		this.addAll(emotes);
		return emotes;
	}
}
