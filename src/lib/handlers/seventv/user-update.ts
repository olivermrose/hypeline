import { invoke } from "@tauri-apps/api/core";
import { app } from "$lib/app.svelte";
import { SystemMessage } from "$lib/models/message/system-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "user.update",
	async handle(data) {
		const channel = app.channels.values().find((c) => c.seventvId === data.id);
		if (!channel) return;

		const message = new SystemMessage(channel);

		const root = data.updated?.find((c) => c.key === "connections");
		if (!root) return;

		const child = root.value.find(
			(c) => c.key === "emote_set" && c.value?.id !== channel.emoteSetId,
		);
		if (!child) return;

		const twitch = data.actor.connections.find((c) => c.platform === "TWITCH");
		if (!twitch) return;

		const actor = await channel.viewers.fetch(twitch.id);

		channel.emoteSetId = child.value?.id ?? null;
		channel.emotes.clear("7TV");

		if (child.value == null) {
			message.context = {
				type: "emoteSetChange",
				actor,
			};
		} else {
			message.context = {
				type: "emoteSetChange",
				name: child.value.name,
				actor,
			};

			await channel.emotes.fetch7tv();
			await invoke("resub_emote_set", { setId: channel.emoteSetId });
		}

		channel.chat.addMessage(message);
	},
});
