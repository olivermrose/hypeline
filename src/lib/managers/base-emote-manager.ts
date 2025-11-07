import { SvelteMap } from "svelte/reactivity";
import type { Emote } from "$lib/emotes";

export interface EmoteProviderOptions {
	ffz?: boolean;
	bttv?: boolean;
	seventv?: boolean;
}

export abstract class BaseEmoteManager extends SvelteMap<string, Emote> {
	public abstract fetchFfz(): Promise<Emote[]>;
	public abstract fetchBttv(): Promise<Emote[]>;
	public abstract fetch7tv(): Promise<Emote[]>;

	/**
	 * Retrieves the list of emotes from the specified providers and caches them
	 * for later use.
	 */
	public async fetch(options: EmoteProviderOptions = { ffz: true, bttv: true, seventv: true }) {
		const promises: Promise<Emote[]>[] = [];

		if (options.ffz) {
			promises.push(this.fetchFfz());
		}

		if (options.bttv) {
			promises.push(this.fetchBttv());
		}

		if (options.seventv) {
			promises.push(this.fetch7tv());
		}

		const emotes = await Promise.all(promises);
		return emotes.flat();
	}

	public addAll(emotes: Iterable<Emote>) {
		for (const emote of emotes) {
			this.set(emote.name, emote);
		}

		return this;
	}
}
