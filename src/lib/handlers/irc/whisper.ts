import { app } from "$lib/app.svelte";
import { Whisper } from "$lib/models";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "whisper",
	global: true,
	async handle(data, user) {
		const sender = await app.twitch.users.fetch(data.sender.id);

		if (!user.whispers.has(sender.id)) {
			user.whispers.set(sender.id, new Whisper(app.twitch, sender.id));
		}

		const whisper = user.whispers.get(sender.id)!;

		whisper.messages.push({
			id: crypto.randomUUID(),
			createdAt: new Date(),
			badges: data.badges
				.map((b) => app.twitch.badges.get(`${b.name}:${b.version}`))
				.filter((b) => b != null),
			user: sender,
			text: data.message_text,
		});

		whisper.unread++;
	},
});
