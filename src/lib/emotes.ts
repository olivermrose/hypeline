import type { FragmentOf } from "gql.tada";
import type { User } from "./models/user.svelte";

export type EmoteProvider = "Twitch" | "FrankerFaceZ" | "BetterTTV" | "7TV";

export interface Emote {
	/**
	 * Which provider the emote is from.
	 */
	readonly provider: EmoteProvider;

	/**
	 * The id of the emote.
	 */
	readonly id: string;

	/**
	 * The name of the emote.
	 */
	name: string;

	/**
	 * The width of the emote.
	 */
	readonly width: number;

	/**
	 * The height of the emote.
	 */
	readonly height: number;

	/**
	 * The candidate urls to use at 1x, 2x, 3x, and optionally 4x pixel
	 * densities.
	 */
	readonly srcset: string[];

	/**
	 * Whether the emote is zero-width i.e. can be used to modify other emotes.
	 * 7TV only.
	 */
	readonly zeroWidth?: boolean;
}

export interface EmoteSet {
	/**
	 * The id of the emote set.
	 */
	readonly id: string;

	/**
	 * The name of the emote set.
	 */
	readonly name: string;

	/**
	 * The owner of the emote set.
	 */
	readonly owner: Pick<User, "id" | "displayName" | "avatarUrl">;

	/**
	 * The emotes in the emote set.
	 */
	readonly emotes: Emote[];

	/**
	 * Whether the emote set can be used in any channel.
	 */
	readonly global?: boolean;
}

export interface FfzEmote {
	id: number;
	name: string;
	height: number;
	width: number;
	urls: Record<number, string>;
}

export interface FfzEmoteSet {
	emoticons: FfzEmote[];
}

export interface GlobalSet {
	sets: Record<number, FfzEmoteSet>;
}

export interface BttvEmote {
	id: string;
	code: string;
	width?: number;
	height?: number;
}

export type SevenTvEmote = FragmentOf<typeof import("$lib/graphql/fragments").emoteDetailsFragment>;

export function transformFfzEmote(emote: FfzEmote): Emote {
	return {
		provider: "FrankerFaceZ",
		id: emote.id.toString(),
		name: emote.name,
		width: emote.width,
		height: emote.height,
		srcset: Object.entries(emote.urls).map(([n, url]) => `${url} ${n}x`),
	};
}

export function transformBttvEmote(emote: BttvEmote): Emote {
	return {
		provider: "BetterTTV",
		id: emote.id,
		name: emote.code,
		width: emote.width ?? 28,
		height: emote.height ?? 28,
		srcset: [1, 2, 3].map((n) => `https://cdn.betterttv.net/emote/${emote.id}/${n}x ${n}x`),
	};
}

export function transform7tvEmote(emote: SevenTvEmote, alias?: string): Emote {
	let width = 28;
	let height = 28;
	const srcset: string[] = [];

	for (const format of ["webp", "gif", "png"]) {
		const images = emote.images.filter(
			(img) => !img.url.includes("static") && img.mime.endsWith(format),
		);

		if (images.length) {
			images.sort((a, b) => b.width - a.width);

			for (const img of images) {
				width = img.width;
				height = img.height;

				srcset.push(`${img.url} ${img.scale}x`);
			}

			break;
		}
	}

	return {
		provider: "7TV",
		id: emote.id,
		name: alias ?? emote.defaultName,
		width,
		height,
		srcset,
		zeroWidth: emote.flags.defaultZeroWidth,
	};
}
