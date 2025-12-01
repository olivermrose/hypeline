import { RuneStore } from "@tauri-store/svelte";
import type { Emote } from "./emotes";
import type { Badge } from "./graphql/fragments";

interface Cache {
	[key: string]: unknown;

	badges: Badge[];
	emotes: Emote[];
}

export const cache = new RuneStore<Cache>("cache", {
	badges: [],
	emotes: [],
});
