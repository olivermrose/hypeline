import { error } from "@sveltejs/kit";
import { page } from "$app/state";
import type { Whisper } from "$lib/models";

export function load({ params }) {
	const whisper: Whisper | undefined = page.data.whispers.get(params.id);
	if (!whisper) error(404);

	whisper.unread = 0;

	return { whisper };
}
