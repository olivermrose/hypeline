import { SvelteMap } from "svelte/reactivity";
import type { Emote } from "$lib/emotes";
import { settings } from "$lib/settings";

export abstract class BaseEmoteManager extends SvelteMap<string, Emote> {
	public abstract fetchFfz(): Promise<Emote[]>;
	public abstract fetchBttv(): Promise<Emote[]>;
	public abstract fetch7tv(): Promise<Emote[]>;

	/**
	 * Retrieves the list of emotes from the providers enabled in the settings and
	 * caches them for later use.
	 */
	public async fetch() {
		const promises: Promise<Emote[]>[] = [];

		if (settings.state.chat.emotes.ffz) {
			promises.push(this.fetchFfz());
		}

		if (settings.state.chat.emotes.bttv) {
			promises.push(this.fetchBttv());
		}

		if (settings.state.chat.emotes.seventv) {
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
