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

export interface Clip {
	title: string;
	url: string;
	creator_name: string;
	created_at: string;
	view_count: number;
	thumbnail_url: string;
}
