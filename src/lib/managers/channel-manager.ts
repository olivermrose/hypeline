import { SvelteMap } from "svelte/reactivity";
import { Channel } from "$lib/models/channel.svelte";
import type { TwitchClient } from "$lib/twitch/client";

export class ChannelManager extends SvelteMap<string, Channel> {
	public constructor(public readonly client: TwitchClient) {
		super();
	}

	public getByLogin(login: string) {
		return this.values().find((c) => c.user.username === login);
	}

	public async fetch(id: string, force = false) {
		if (!force) {
			const cached = this.get(id);
			if (cached) return cached;
		}

		const user = await this.client.users.fetch(id);
		const channel = new Channel(this.client, user);

		this.set(id, channel);

		return channel;
	}
}
