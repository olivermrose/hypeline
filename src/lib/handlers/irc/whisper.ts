import { app } from "$lib/app.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "whisper",
	channel: false,
	async handle(data) {
		if (!app.user) return;

		const sender = await app.twitch.users.fetch(data.sender.id);

		if (!app.user.whispers.has(sender.id)) {
			app.user.whispers.set(sender.id, []);
		}

		const messages = app.user.whispers.get(sender.id)!;

		messages.push({
			badges: data.badges
				.map((b) => app.twitch.badges.get(`${b.name}:${b.version}`))
				.filter((b) => b != null),
			sender,
			message: data.message_text,
		});
	},
});
