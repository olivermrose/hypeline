import { betterFetch as fetch } from "@better-fetch/fetch";
import { SvelteMap } from "svelte/reactivity";
import { transform7tvEmote, transformBttvEmote, transformFfzEmote } from "$lib/emotes";
import type { BttvEmote, Emote, GlobalSet } from "$lib/emotes";
import { ApiError } from "$lib/errors";
import { emoteSetDetailsFragment, seventvGql as gql, send7tv as send } from "$lib/graphql";

export interface EmoteProviderOptions {
	ffz?: boolean;
	bttv?: boolean;
	seventv?: boolean;
}

export class EmoteManager extends SvelteMap<string, Emote> {
	/**
	 * Retrieves the list of global emotes from the specified providers (FFZ, BTTV,
	 * and 7TV by default) and caches them for later use.
	 */
	public fetchGlobal(
		providers: EmoteProviderOptions = {
			ffz: true,
			bttv: true,
			seventv: true,
		},
	) {
		const promises: Promise<Emote[]>[] = [];

		if (providers.ffz) {
			promises.push(this.fetchFfzGlobal());
		}

		if (providers.bttv) {
			promises.push(this.fetchBttvGlobal());
		}

		if (providers.seventv) {
			promises.push(this.fetch7tvGlobal());
		}

		return Promise.all(promises);
	}

	/**
	 * Retrieves the list of global FrankerFaceZ emotes.
	 */
	public async fetchFfzGlobal() {
		const { data, error } = await fetch<GlobalSet>(
			"https://api.frankerfacez.com/v1/set/global",
		);

		if (error) {
			throw new ApiError(error.status, error.statusText);
		}

		// 3 is the global set id
		return data.sets[3].emoticons.map(transformFfzEmote);
	}

	/**
	 * Retrieves the list of global BetterTTV emotes.
	 */
	public async fetchBttvGlobal() {
		const { data, error } = await fetch<BttvEmote[]>(
			"https://api.betterttv.net/3/cached/emotes/global",
		);

		if (error) {
			throw new ApiError(error.status, error.statusText);
		}

		return data.map(transformBttvEmote);
	}

	/**
	 * Retrieves the list of global 7TV emotes.
	 */
	public async fetch7tvGlobal() {
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

		return emoteSets.emoteSet!.emotes.items.map((item) => transform7tvEmote(item.emote));
	}
}
