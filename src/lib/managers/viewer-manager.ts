import { invoke } from "@tauri-apps/api/core";
import { SvelteMap } from "svelte/reactivity";
import type { Channel } from "$lib/channel.svelte";
import { app } from "$lib/state.svelte";
import { Viewer } from "$lib/viewer.svelte";

export interface TimeoutOptions {
	duration: number;
	reason?: string;
}

export class ViewerManager extends SvelteMap<string, Viewer> {
	public constructor(public readonly channel: Channel) {
		super();
	}

	public async fetch(id: string, force = false) {
		if (!force) {
			const cached = this.get(id);
			if (cached) return cached;
		}

		const user = await app.fetchUser(id);
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
