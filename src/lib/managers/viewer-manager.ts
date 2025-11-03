import { invoke } from "@tauri-apps/api/core";
import { SvelteMap } from "svelte/reactivity";
import type { TwitchApiClient } from "$lib/twitch/client";
import { Viewer } from "../viewer.svelte";
import type { Channel } from "../channel.svelte";
import type { TimeoutOptions } from "../viewer.svelte";

export class ViewerManager extends SvelteMap<string, Viewer> {
	public readonly client: TwitchApiClient;

	public constructor(public readonly channel: Channel) {
		super();

		this.client = channel.client;
	}

	public async fetch(id: string, force = false) {
		if (!force) {
			const cached = this.get(id);
			if (cached) return cached;
		}

		const user = await this.client.users.fetch(id);
		const viewer = new Viewer(this.channel, user);

		this.set(id, viewer);
		return viewer;
	}

	public async vip(id: string) {
		await invoke("add_vip", {
			broadcasterId: this.channel.user.id,
			userId: id,
		});
	}

	public async unvip(id: string) {
		await invoke("remove_vip", {
			broadcasterId: this.channel.user.id,
			userId: id,
		});
	}

	public async mod(id: string) {
		await invoke("add_moderator", {
			broadcasterId: this.channel.user.id,
			userId: id,
		});
	}

	public async unmod(id: string) {
		await invoke("remove_moderator", {
			broadcasterId: this.channel.user.id,
			userId: id,
		});
	}

	public async warn(id: string, reason: string) {
		await invoke("warn", {
			broadcasterId: this.channel.user.id,
			userId: id,
			reason,
		});
	}

	public async timeout(id: string, options: TimeoutOptions) {
		await invoke("ban", {
			broadcasterId: this.channel.user.id,
			userId: id,
			duration: options.duration,
			reason: options.reason || null,
		});
	}

	public async ban(id: string, reason?: string) {
		await invoke("ban", {
			broadcasterId: this.channel.user.id,
			userId: id,
			duration: null,
			reason: reason || null,
		});
	}

	public async unban(id: string) {
		await invoke("unban", {
			broadcasterId: this.channel.user.id,
			userId: id,
		});
	}
}
