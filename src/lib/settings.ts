import { RuneStore } from "@tauri-store/svelte";
import type { User } from "./graphql/twitch";

export interface TimestampSettings {
	show: boolean;
	format: "auto" | "12" | "24" | "custom";
	customFormat: string;
}

export interface AppearanceSettings {
	timestamps: TimestampSettings;
}

export interface UsernameSettings {
	localized: boolean;
	readable: boolean;
	paint: boolean;
	mentionStyle: "none" | "colored" | "painted";
}

export interface EmoteSettings {
	ffz: boolean;
	bttv: boolean;
	seventv: boolean;
	padding: number;
}

export interface HistorySettings {
	enabled: boolean;
	limit: number;
	separator: boolean;
}

export interface MessageSettings {
	duplicateBypass: boolean;
	history: HistorySettings;
}

export interface ChatSettings {
	scrollbar: boolean;
	newSeparator: boolean;
	embeds: boolean;
	usernames: UsernameSettings;
	emotes: EmoteSettings;
	messages: MessageSettings;
}

export type HighlightType =
	| "mention"
	| "new"
	| "returning"
	| "suspicious"
	| "broadcaster"
	| "moderator"
	| "subscriber"
	| "vip";

export interface HighlightConfig {
	enabled: boolean;
	color: string;
	style: "default" | "compact" | "background";
}

export interface KeywordHighlightConfig extends HighlightConfig {
	pattern: string;
	regex: boolean;
	wholeWord: boolean;
	matchCase: boolean;
}

export interface HighlightSettings extends Record<HighlightType, HighlightConfig> {
	enabled: boolean;
	keywords: KeywordHighlightConfig[];
}

export interface AdvancedSettings {
	singleConnection: boolean;
}

interface StoredUser {
	id: string;
	token: string;
	data: User;
	moderating: string[];
}

export interface Settings {
	// Index signature needed for RuneStore
	[key: string]: unknown;

	// Internal
	user: StoredUser | null;
	lastJoined: string | null;

	// User
	appearance: AppearanceSettings;
	chat: ChatSettings;
	highlights: HighlightSettings;
	advanced: AdvancedSettings;
}

export const defaultHighlightTypes: Record<HighlightType, HighlightConfig> = {
	mention: { enabled: true, color: "#adadb8", style: "background" },
	new: { enabled: true, color: "#ff75e6", style: "default" },
	returning: { enabled: true, color: "#00a3a3", style: "default" },
	suspicious: { enabled: true, color: "#ff8280", style: "default" },
	broadcaster: { enabled: false, color: "#fc3430", style: "default" },
	moderator: { enabled: false, color: "#00a865", style: "default" },
	subscriber: { enabled: false, color: "#528bff", style: "default" },
	vip: { enabled: false, color: "#db00b3", style: "default" },
};

export const settings = new RuneStore<Settings>("settings", {
	user: null,
	lastJoined: null,
	appearance: {
		timestamps: {
			show: true,
			format: "auto",
			customFormat: "",
		},
	},
	chat: {
		scrollbar: true,
		newSeparator: false,
		embeds: true,
		usernames: {
			localized: true,
			readable: true,
			paint: true,
			mentionStyle: "painted",
		},
		emotes: {
			ffz: true,
			bttv: true,
			seventv: true,
			padding: 0,
		},
		messages: {
			duplicateBypass: true,
			history: {
				enabled: true,
				limit: 250,
				separator: true,
			},
		},
	},
	highlights: {
		enabled: true,
		keywords: [],
		...defaultHighlightTypes,
	},
	advanced: {
		singleConnection: false,
	},
});
