import type { Emote } from "$lib/emotes";
import type {
	AutoModMessageStatus,
	AutoModTermsMetadata,
	ChannelUnbanRequestCreate,
	ChannelUnbanRequestResolve,
	WarnMetadata,
} from "$lib/twitch/eventsub";
import type { User } from "../user.svelte";
import type { Viewer } from "../viewer.svelte";

export interface AutoModContext {
	type: "autoMod";
	status: AutoModMessageStatus;
	viewer: Viewer;
	moderator: Viewer;
}

export interface BannedContext {
	type: "banned";
}

export interface BanStatusContext {
	type: "banStatus";
	banned: boolean;
	reason: string | null;
	viewer: Viewer;
	moderator?: Viewer;
}

export interface BlockStatusContext {
	type: "blockStatus";
	blocked: boolean;
	user: User;
}

export interface ClearContext {
	type: "clear";
	moderator?: Viewer;
}

export interface DeleteContext {
	type: "delete";
	text: string;
	user: User;
	moderator?: Viewer;
}

export interface EmoteSetChangeContext {
	type: "emoteSetChange";
	name?: string;
	actor: Viewer;
}

export interface EmoteSetUpdateContext {
	type: "emoteSetUpdate";
	action: "added" | "removed" | "renamed";
	oldName?: string;
	emote: Emote;
	actor: Viewer;
}

export interface JoinContext {
	type: "join";
}

export interface ModeContext {
	type: "mode";
	mode: string;
	enabled: boolean;
	seconds: number;
	moderator: Viewer;
}

export interface RaidContext {
	type: "raid";
	viewers: number;
	user: User;
	moderator: Viewer;
}

export interface RoleStatusContext {
	type: "roleStatus";
	role: string;
	added: boolean;
	viewer: Viewer;
}

export interface StreamStatusContext {
	type: "streamStatus";
	online: boolean;
}

export interface SuspicionStatusContext {
	type: "suspicionStatus";
	active: boolean;
	previous: "monitoring" | "restricting" | null;
	viewer: Viewer;
	moderator: Viewer;
}

export interface TermContext {
	type: "term";
	data: AutoModTermsMetadata;
	moderator: Viewer;
}

export interface TimeoutContext {
	type: "timeout";
	seconds: number;
	reason: string | null;
	viewer: Viewer;
	moderator?: Viewer;
}

export interface UnbanRequestContext {
	type: "unbanRequest";
	request: ChannelUnbanRequestCreate | ChannelUnbanRequestResolve;
	viewer: Viewer;
	moderator?: Viewer;
}

export interface UnraidContext {
	type: "unraid";
	user: User;
	moderator: Viewer;
}

export interface UntimeoutContext {
	type: "untimeout";
	viewer: Viewer;
	moderator: Viewer;
}

export interface WarnContext {
	type: "warn";
	warning: WarnMetadata;
	viewer: Viewer;
	moderator: Viewer;
}

export interface WarnAckContext {
	type: "warnAck";
	viewer: Viewer;
}

export type MessageContext =
	| AutoModContext
	| BannedContext
	| BanStatusContext
	| BlockStatusContext
	| ClearContext
	| DeleteContext
	| EmoteSetChangeContext
	| EmoteSetUpdateContext
	| JoinContext
	| ModeContext
	| RaidContext
	| RoleStatusContext
	| StreamStatusContext
	| SuspicionStatusContext
	| TermContext
	| TimeoutContext
	| UnbanRequestContext
	| UnraidContext
	| UntimeoutContext
	| WarnContext
	| WarnAckContext;
