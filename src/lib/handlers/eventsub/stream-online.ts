import { invoke } from "@tauri-apps/api/core";
import { SystemMessage } from "$lib/message";
import type { Stream } from "$lib/twitch/api";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "stream.online",
	async handle(data, channel) {
		const broadcaster = await channel.viewers.fetch(data.broadcaster_user_id);
		const stream = await invoke<Stream | null>("get_stream", { id: data.broadcaster_user_id });

		channel.stream = stream;
		channel.addMessage(
			SystemMessage.fromContext({
				type: "streamStatus",
				online: true,
				broadcaster,
			}),
		);
	},
});
