import { page } from "$app/state";
import { app } from "$lib/app.svelte";
import { Whisper } from "$lib/models/whisper.svelte";
import { getOrInsertComputed } from "$lib/util";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "whisper",
	async handle(data) {
		if (!app.user) return;

		const sender = await app.twitch.users.fetch(data.sender.id);

		const whisper = getOrInsertComputed(
			app.user.whispers,
			sender.id,
			() => new Whisper(app.twitch, sender),
		);

		whisper.messages.push({
			id: data.message_id,
			createdAt: new Date(),
			badges: data.badges
				.map((b) => app.badges.get(`${b.name}:${b.version}`))
				.filter((b) => b != null),
			user: sender,
			text: data.message_text,
		});

		if (page.url.pathname !== `/whispers/${sender.id}`) {
			whisper.unread++;
		}
	},
});
