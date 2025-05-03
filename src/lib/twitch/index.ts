import { Channel, invoke } from "@tauri-apps/api/core";
import { handlers } from "$lib/handlers";
import type { IrcMessage } from "./irc";
import type { NotificationPayload } from "./eventsub";

export const SCOPES = [
	// Channel
	"channel:edit:commercial",
	"channel:manage:broadcast",
	"channel:manage:moderators",
	"channel:manage:polls",
	"channel:manage:predictions",
	"channel:manage:raids",
	"channel:manage:redemptions",
	"channel:manage:vips",
	"channel:moderate",
	"channel:read:editors",
	"channel:read:hype_train",
	"channel:read:polls",
	"channel:read:predictions",
	"channel:read:redemptions",

	// Chat
	"chat:edit",
	"chat:read",

	// Moderation
	"moderator:manage:announcements",
	"moderator:manage:automod",
	"moderator:manage:banned_users",
	"moderator:manage:blocked_terms",
	"moderator:manage:chat_messages",
	"moderator:manage:chat_settings",
	"moderator:manage:shield_mode",
	"moderator:manage:shoutouts",
	"moderator:manage:unban_requests",
	"moderator:manage:warnings",
	"moderator:read:chatters",
	"moderator:read:moderators",
	"moderator:read:suspicious_users",
	"moderator:read:vips",

	// User
	"user:manage:blocked_users",
	"user:manage:chat_color",
	"user:manage:whispers",
	"user:read:blocked_users",
	"user:read:chat",
	"user:read:emotes",
	"user:read:follows",
	"user:read:moderated_channels",
	"user:write:chat",

	// Other
	"clips:edit",
	"whispers:read",
];

export async function connect() {
	const ircChannel = new Channel<IrcMessage>(async (message) => {
		const handler = handlers.get(message.type);
		await handler?.handle(message);
	});

	const eventsubChannel = new Channel<NotificationPayload>(
		async (message) => {
			const handler = handlers.get(message.subscription.type);
			await handler?.handle(message.event);
		},
	);

	await invoke("connect_irc", { channel: ircChannel });
	await invoke("connect_eventsub", { channel: eventsubChannel });
}
