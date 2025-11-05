import type { EmoteSet } from "./seventv";

export interface Emote {
	name: string;
	width: number;
	height: number;
	srcset: string[];
	zero_width: boolean;
}

export interface UserEmote {
	set_id: string;
	id: string;
	name: string;
	type: string;
	format: string;
	owner: string;
	owner_profile_picture_url: string;
}

export interface JoinedChannel {
	emotes: Record<string, Emote>;
	emote_set: EmoteSet | null;
}
