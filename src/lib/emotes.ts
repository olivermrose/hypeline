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
	readonly name: string;

	/**
	 * The width of the emote.
	 */
	readonly width: number;

	/**
	 * The height of the emote.
	 */
	readonly height: number;

	/**
	 * The candidate urls to use at 1x, 2x, and 3x pixel densities.
	 */
	readonly srcset: string[];

	/**
	 * Whether the emote is zero-width i.e. can be used to modify other emotes.
	 * 7TV only.
	 */
	readonly zeroWidth: boolean;
}

// 7TV
export interface EmoteSet {
	/**
	 * The id of the emote set.
	 */
	readonly id: string;

	/**
	 * The emotes in the emote set.
	 */
	readonly emotes: Emote[];
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

export interface EmoteImage {
	mime: string;
	width: number;
	height: number;
	url: string;
}

export interface EmoteFlags {
	defaultZeroWidth: boolean;
}

export interface SevenTvEmote {
	id: string;
	defaultName: string;
	images: EmoteImage[];
	flags: EmoteFlags;
}

export function transformFfzEmote(emote: FfzEmote): Emote {
	return {
		provider: "FrankerFaceZ",
		id: emote.id.toString(),
		name: emote.name,
		width: emote.width,
		height: emote.height,
		srcset: Object.entries(emote.urls).map(([n, url]) => `${url} ${n}x`),
		zeroWidth: false,
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
		zeroWidth: false,
	};
}

export function transform7tvEmote(emote: SevenTvEmote): Emote {
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

				const [, n] = /(\d+)x\./.exec(img.url) ?? [];

				srcset.push(`${img.url} ${n}x`);
			}

			break;
		}
	}

	return {
		provider: "7TV",
		id: emote.id,
		name: emote.defaultName,
		width,
		height,
		srcset,
		zeroWidth: emote.flags.defaultZeroWidth,
	};
}
