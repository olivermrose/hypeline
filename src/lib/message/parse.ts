import { parse as parseTld } from "tldts";
import { app } from "$lib/state.svelte";
import type { Emote } from "$lib/tauri";
import type { CheermoteTier } from "$lib/twitch/api";
import type { Range } from "$lib/twitch/irc";
import type { User } from "$lib/user.svelte";
import { find } from "$lib/util";
import type { UserMessage } from "./user-message";

export interface BaseNode {
	start: number;
	end: number;
	value: string;
	marked: boolean;
}

export interface TextNode extends BaseNode {
	type: "text";
	data: string;
}

export interface LinkNode extends BaseNode {
	type: "link";
	data: {
		url: URL;
		tld: ReturnType<typeof parseTld>;
	};
}

export interface MentionNode extends BaseNode {
	type: "mention";
	data: {
		user: User | undefined;
	};
}

export interface CheerNode extends BaseNode {
	type: "cheer";
	data: {
		prefix: string;
		bits: number;
		tier: CheermoteTier;
	};
}

export interface EmoteNode extends BaseNode {
	type: "emote";
	data: {
		layers: Emote[];
		emote: Emote;
	};
}

export type Node = TextNode | LinkNode | MentionNode | CheerNode | EmoteNode;

export function parse(message: UserMessage): Node[] {
	const nodes: Node[] = [];

	const ircEmotes = [...message.data.emotes];
	const boundaries = translateBoundaries(message);

	for (const match of message.text.matchAll(/\S+|\s+/g)) {
		const prevNode = nodes.at(-1);
		let marked = false;

		const part = match[0];
		const start = match.index;
		const end = start + part.length;

		for (const boundary of boundaries) {
			if (end > boundary.start && start <= boundary.end) {
				marked = true;
				break;
			}
		}

		const base: BaseNode = {
			start,
			end,
			value: part,
			marked,
		};

		const url = URL.parse(`https://${part.replace(/^https?:\/\/|\.$/i, "")}`);
		const tld = url ? parseTld(url.hostname) : null;

		const cheermote = app.joined?.cheermotes.find((c) => {
			const hasPrefix = part.toLowerCase().startsWith(c.prefix.toLowerCase());
			const hasBits = /\d+$/.test(part);

			return hasPrefix && hasBits;
		});

		const ircEmote = ircEmotes.find((e) => e.code === part);
		const emote = app.joined?.emotes.get(part);

		if (url && tld?.domain && tld.isIcann) {
			nodes.push({
				...base,
				type: "link",
				data: { url, tld },
			});
		} else if (/^@\w{4,24}$/.test(part)) {
			const name = part.slice(1).toLowerCase();
			const viewer = find(app.joined?.viewers ?? [], (u) => u.username === name);

			nodes.push({
				...base,
				type: "mention",
				data: { user: viewer?.user },
			});
		} else if (cheermote) {
			const amount = Number(part.slice(cheermote.prefix.length));

			if (amount > 0) {
				let selectedTier: CheermoteTier | undefined;

				for (const tier of cheermote.tiers.toSorted((a, b) => b.min_bits - a.min_bits)) {
					if (amount >= tier.min_bits) {
						selectedTier = tier;
						break;
					}
				}

				if (selectedTier) {
					nodes.push({
						...base,
						type: "cheer",
						data: {
							prefix: cheermote.prefix,
							bits: amount,
							tier: selectedTier,
						},
					});
				}
			}
		} else if (ircEmote) {
			for (const boundary of boundaries) {
				if (ircEmote.range.end > boundary.start && ircEmote.range.start <= boundary.end) {
					marked = true;
					break;
				}
			}

			const baseUrl = "https://static-cdn.jtvnw.net/emoticons/v2";

			nodes.push({
				start: ircEmote.range.start,
				end: ircEmote.range.end,
				value: ircEmote.code,
				marked,
				type: "emote",
				data: {
					emote: {
						name: ircEmote.code,
						width: 56,
						height: 56,
						srcset: [1, 2, 3].map((density) => {
							return `${baseUrl}/${ircEmote.id}/default/dark/${density}.0 ${density}x`;
						}),
						zero_width: false,
					},
					layers: [],
				},
			});

			const foundIdx = ircEmotes.indexOf(ircEmote);
			ircEmotes.splice(foundIdx, 1);
		} else if (emote) {
			if (emote.zero_width && prevNode?.type === "emote") {
				prevNode.data.layers.push(emote);
			} else {
				nodes.push({
					...base,
					type: "emote",
					data: {
						emote,
						layers: [],
					},
				});
			}
		} else {
			nodes.push({
				...base,
				type: "text",
				data: part,
			});
		}
	}

	const merged: Node[] = [];

	for (const node of nodes) {
		const prevNode = merged.at(-1);

		if (node.type === "text" && prevNode?.type === "text" && node.marked === prevNode.marked) {
			prevNode.end = node.end;
			prevNode.value += node.value;
			prevNode.data += node.data;
		} else {
			merged.push(node);
		}
	}

	return merged;
}

function translateBoundaries(message: UserMessage): Range[] {
	if (!message.autoMod?.boundaries) return [];

	const map = [0];
	let index = 0;

	const segmenter = new Intl.Segmenter(navigator.language, { granularity: "grapheme" });

	for (const data of segmenter.segment(message.text)) {
		index += data.segment.length;
		map.push(index);
	}

	return message.autoMod.boundaries.map((b) => ({
		start: map[b.start_pos],
		end: map[b.end_pos],
	}));
}
