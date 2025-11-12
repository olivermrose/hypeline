import { app } from "$lib/app.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "whisper",
	global: true,
	async handle(data, user) {
		const sender = await app.twitch.users.fetch(data.sender.id);

		if (!user.whispers.has(sender.id)) {
			user.whispers.set(sender.id, []);
		}

		const messages = user.whispers.get(sender.id)!;

		messages.push({
			badges: data.badges
				.map((b) => app.twitch.badges.get(`${b.name}:${b.version}`))
				.filter((b) => b != null),
			sender,
			message: data.message_text,
		});
	},
});
