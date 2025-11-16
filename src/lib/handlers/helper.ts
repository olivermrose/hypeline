import type { Channel } from "$lib/models/channel.svelte";
import type { User } from "$lib/models/user.svelte";
import type { SevenTvEventMap } from "$lib/seventv";
import type { SubscriptionEventMap } from "$lib/twitch/eventsub";
import type { IrcMessageMap } from "$lib/twitch/irc";

type HandlerKey = keyof IrcMessageMap | keyof SubscriptionEventMap | keyof SevenTvEventMap;

type HandlerData<K> = K extends keyof IrcMessageMap
	? IrcMessageMap[K]
	: K extends keyof SubscriptionEventMap
		? SubscriptionEventMap[K]
		: K extends keyof SevenTvEventMap
			? SevenTvEventMap[K]
			: never;

interface ChannelHandler<K> {
	name: K;
	global?: false;
	handle: (data: HandlerData<K>, channel: Channel) => Promise<void> | void;
}

interface GlobalHandler<K> {
	name: K;
	global: true;
	handle: (data: HandlerData<K>, user: User) => Promise<void> | void;
}

export type Handler<K extends HandlerKey = HandlerKey> = ChannelHandler<K> | GlobalHandler<K>;

export function defineHandler<K extends HandlerKey>(handler: Handler<K>) {
	if (handler.global === undefined) {
		handler.global = false;
	}

	return handler;
}
