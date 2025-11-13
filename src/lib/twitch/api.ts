export type CheermoteImageSet = Record<
	"dark" | "light",
	Record<"animated" | "static", Record<string, string>>
>;

export interface CheermoteTier {
	min_bits: number;
	id: string;
	color: string;
	images: CheermoteImageSet;
	can_cheer: boolean;
	show_in_bits_card: boolean;
}

export type CheermoteType =
	| "global_first_party"
	| "global_third_party"
	| "channel_custom"
	| "display_only"
	| "sponsored";

export interface Cheermote {
	prefix: string;
	tiers: CheermoteTier[];
	type: CheermoteType;
	order: number;
	last_updated: string;
	is_charitable: boolean;
}

export interface DropReason {
	code: string;
	message: string;
}

export interface SentMessage {
	message_id: string;
	is_sent: boolean;
	drop_reason?: DropReason;
}

export interface Stream {
	id: string;
	user_id: string;
	user_login: string;
	user_name: string;
	game_id: string;
	game_name: string;
	type: "live";
	title: string;
	tags: string[];
	viewer_count: number;
	started_at: string;
	language: string;
	thumbnail_url: string;
	is_mature: boolean;
}

export interface StreamMarker {
	id: string;
	created_at: string;
	position_seconds: number;
	description: string;
}

// Not a part of Twitch's API but related. Not all fields are included.

export interface SubscriptionTenure {
	months: number;
}

export interface SubscriptionMetadata {
	type: "prime" | "paid" | "gift";
	tier: string;
}

export interface SubscriptionAge {
	statusHidden: boolean;
	followedAt: string | null;
	cumulative: SubscriptionTenure | null;
	meta: SubscriptionMetadata | null;
}
