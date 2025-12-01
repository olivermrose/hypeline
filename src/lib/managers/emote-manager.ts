import { betterFetch as fetch } from "@better-fetch/fetch";
import { app } from "$lib/app.svelte";
import { cache } from "$lib/cache";
import { transform7tvEmote, transformBttvEmote, transformFfzEmote } from "$lib/emotes";
import type { BttvEmote, GlobalSet } from "$lib/emotes";
import { ApiError } from "$lib/errors/api-error";
import { send7tv as send } from "$lib/graphql";
import { emoteSetDetailsFragment } from "$lib/graphql/fragments";
import { seventvGql as gql } from "$lib/graphql/function";
import { BaseEmoteManager } from "./base-emote-manager";

export class EmoteManager extends BaseEmoteManager {
	// public addGlobalSet

	public override async fetch() {
		const emotes = await super.fetch();
		cache.state.emotes = emotes;

		return emotes;
	}

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
		const emotes = data.sets[3].emoticons.map(transformFfzEmote);

		app.emoteSets.set("ffz_global", {
			id: "ffz_global",
			name: "Global: FrankerFaceZ",
			owner: {
				id: "ffz_global",
				displayName: "FrankerFaceZ Global",
				avatarUrl: "https://www.frankerfacez.com/static/images/cover/zreknarf.png",
			},
			global: true,
			emotes,
		});

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

		const emotes = data.map(transformBttvEmote);

		app.emoteSets.set("bttv_global", {
			id: "bttv_global",
			name: "Global: BetterTTV",
			owner: {
				id: "bttv_global",
				displayName: "BetterTTV Global",
				avatarUrl: "https://betterttv.com/favicon.png",
			},
			global: true,
			emotes,
		});

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

		const emotes = emoteSets.emoteSet!.emotes.items.map((item) =>
			transform7tvEmote(item.emote, item.alias),
		);

		app.emoteSets.set(emoteSets.emoteSet!.id, {
			id: emoteSets.emoteSet!.id,
			name: "Global: 7TV",
			owner: {
				id: "7tv_global",
				displayName: "7TV Global",
				avatarUrl:
					"https://cdn.discordapp.com/icons/817075418054000661/a_a629673a6f485a3db5f5e1724904b2ce.png",
			},
			global: true,
			emotes,
		});

		this.addAll(emotes);
		return emotes;
	}
}
