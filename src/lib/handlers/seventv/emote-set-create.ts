import { app } from "$lib/app.svelte";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "emote_set.create",
	global: true,
	async handle(data) {
		app.emoteSets.set(data.id, {
			id: data.id,
			name: data.name,
			emotes: [],
		});
	},
});
