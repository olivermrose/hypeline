import * as cache from "tauri-plugin-cache-api";
import { app } from "$lib/app.svelte";
import type { Emote } from "$lib/emotes";
import { SystemMessage } from "$lib/models/message/system-message";
import type { EmoteChange } from "$lib/seventv";
import { defineHandler } from "../helper";

function transform(emote: EmoteChange): Emote {
	let width = 28;
	let height = 28;
	const srcset: string[] = [];

	for (const format of ["webp", "png", "gif"]) {
		const files = emote.data.host.files.filter((file) => file.format.toLowerCase() === format);

		if (files.length) {
			files.sort((a, b) => a.width - b.width);

			for (const file of files) {
				width = file.width;
				height = file.height;

				srcset.push(`https:${emote.data.host.url}/${file.name} ${file.name[0]}x`);
			}

			break;
		}
	}

	return {
		provider: "7TV",
		id: emote.id,
		name: emote.name,
		width: width / 2,
		height: height / 2,
		srcset,
		zeroWidth: (emote.data.flags & 256) === 256,
	};
}

export default defineHandler({
	name: "emote_set.update",
	async handle(data, channel) {
		if (data.id === channel.emoteSetId) {
			const twitch = data.actor.connections.find((c) => c.platform === "TWITCH");
			if (!twitch) return;

			const actor = await channel.viewers.fetch(twitch.id);
			const message = new SystemMessage(channel);

			for (const change of data.pushed ?? []) {
				const emote = transform(change.value);

				message.context = {
					type: "emoteSetUpdate",
					action: "added",
					emote,
					actor,
				};

				channel.emotes.set(emote.name, emote);
			}

			for (const change of data.pulled ?? []) {
				message.context = {
					type: "emoteSetUpdate",
					action: "removed",
					emote: channel.emotes.get(change.old_value.name)!,
					actor,
				};

				channel.emotes.delete(change.old_value!.name);
			}

			for (const change of data.updated ?? []) {
				const emote = channel.emotes.get(change.old_value.name);
				if (!emote) continue;

				message.context = {
					type: "emoteSetUpdate",
					action: "renamed",
					oldName: emote.name,
					emote,
					actor,
				};

				emote.name = change.value.name;

				channel.emotes.delete(change.old_value.name);
				channel.emotes.set(change.value.name, emote);
			}

			channel.chat.addMessage(message);
		} else {
			const emoteSet = app.emoteSets.get(data.id);
			if (!emoteSet) return;

			for (const change of data.pushed ?? []) {
				emoteSet.emotes.push(transform(change.value));
			}

			for (const change of data.pulled ?? []) {
				const index = emoteSet.emotes.findIndex((e) => e.id === change.old_value.id);

				if (index !== -1) {
					emoteSet.emotes.splice(index, 1);
				}
			}

			for (const change of data.updated ?? []) {
				const emote = emoteSet.emotes.find((e) => e.id === change.value.id);
				if (!emote) continue;

				emote.name = change.value.name;
			}
		}

		await cache.remove(`emotes:${channel.id}`);
		await cache.set(`emotes:${channel.id}`, channel.emotes.values().toArray());
	},
});
