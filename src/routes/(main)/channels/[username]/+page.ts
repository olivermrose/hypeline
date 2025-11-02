import { invoke } from "@tauri-apps/api/core";
import { settings } from "$lib/settings";
import { app } from "$lib/state.svelte";

export async function load({ params }) {
	await app.joined?.leave();

	const channel = await app.joinChannel(params.username.replace(/^ephemeral:/, ""));

	if (params.username.startsWith("ephemeral:")) {
		channel.ephemeral = true;
		app.channels.push(channel);
	}

	await invoke("fetch_recent_messages", {
		channel: channel.user.username,
		historyLimit: settings.state.chat.history.enabled ? settings.state.chat.history.limit : 0,
	});

	channel.addEmotes(app.globalEmotes);

	return { channel };
}
