import { page } from "$app/state";
import { app } from "$lib/app.svelte";
import { Whisper } from "$lib/models/whisper.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "whisper",
	async handle(data) {
		if (!app.user) return;

		const sender = await app.twitch.users.fetch(data.sender.id);

		if (!app.user.whispers.has(sender.id)) {
			app.user.whispers.set(sender.id, new Whisper(app.twitch, sender));
		}

		const whisper = app.user.whispers.get(sender.id)!;

		whisper.messages.push({
			id: data.message_id,
			createdAt: new Date(),
			badges: data.badges
				.map((b) => app.twitch.badges.get(`${b.name}:${b.version}`))
				.filter((b) => b != null),
			user: sender,
			text: data.message_text,
		});

		if (page.url.pathname !== `/whispers/${sender.id}`) {
			whisper.unread++;
		}
	},
});
