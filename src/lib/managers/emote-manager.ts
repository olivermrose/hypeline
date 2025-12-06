import { betterFetch as fetch } from "@better-fetch/fetch";
import * as cache from "tauri-plugin-cache-api";
import { app } from "$lib/app.svelte";
import { transform7tvEmote, transformBttvEmote, transformFfzEmote } from "$lib/emotes";
import type { BttvEmote, Emote, GlobalSet } from "$lib/emotes";
import { ApiError } from "$lib/errors/api-error";
import { send7tv } from "$lib/graphql";
import { globalEmoteSetQuery } from "$lib/graphql/7tv";
import { BaseEmoteManager } from "./base-emote-manager";

// Still want to find a better way to do this
const GLOBAL_SETS = {
	ffz: {
		name: "Global: FrankerFaceZ",
		owner: {
			id: "ffz_global",
			displayName: "FrankerFaceZ Global",
			avatarUrl: "https://www.frankerfacez.com/static/images/cover/zreknarf.png",
		},
	},
	bttv: {
		name: "Global: BetterTTV",
		owner: {
			id: "bttv_global",
			displayName: "BetterTTV Global",
			avatarUrl: "https://betterttv.com/favicon.png",
		},
	},
	seventv: {
		name: "Global: 7TV",
		owner: {
			id: "7tv_global",
			displayName: "7TV Global",
			avatarUrl:
				"https://cdn.discordapp.com/icons/817075418054000661/a_a629673a6f485a3db5f5e1724904b2ce.png",
		},
	},
};

export class EmoteManager extends BaseEmoteManager {
	public override async fetch(force = false) {
		let emotes = await cache.get<Emote[]>("global_emotes");

		if (force || !emotes) {
			if (force) this.clear();

			emotes = await super.fetch();
			await cache.set("global_emotes", emotes, { ttl: 7 * 24 * 60 * 60 });
		} else {
			this.#addGlobalSet(
				GLOBAL_SETS.ffz,
				emotes.filter((e) => e.provider === "FrankerFaceZ"),
			);

			this.#addGlobalSet(
				GLOBAL_SETS.bttv,
				emotes.filter((e) => e.provider === "BetterTTV"),
			);

			this.#addGlobalSet(
				GLOBAL_SETS.seventv,
				emotes.filter((e) => e.provider === "7TV"),
			);

			this.addAll(emotes);
		}

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

		this.#addGlobalSet(GLOBAL_SETS.ffz, emotes);
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

		this.#addGlobalSet(GLOBAL_SETS.bttv, emotes);
		this.addAll(emotes);

		return emotes;
	}

	/**
	 * Retrieves the list of global 7TV emotes.
	 */
	public override async fetch7tv() {
		const { emoteSets } = await send7tv(globalEmoteSetQuery);

		const emotes = emoteSets.global!.emotes.items.map((item) =>
			transform7tvEmote(item.emote, item.alias),
		);

		this.#addGlobalSet(GLOBAL_SETS.seventv, emotes);
		this.addAll(emotes);

		return emotes;
	}

	#addGlobalSet(set: (typeof GLOBAL_SETS)[keyof typeof GLOBAL_SETS], emotes: Emote[]) {
		app.emoteSets.set(set.owner.id, {
			id: set.owner.id,
			name: set.name,
			owner: set.owner,
			global: true,
			emotes,
		});
	}
}
