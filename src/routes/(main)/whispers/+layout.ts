import { error } from "@sveltejs/kit";
import Chats from "~icons/ph/chats";
import { app } from "$lib/app.svelte";

export function load() {
	if (!app.user) error(401);

	return {
		whispers: app.user.whispers,
		titleBar: {
			icon: Chats,
			title: "Whispers",
		},
	};
}
