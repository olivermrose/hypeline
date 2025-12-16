import { betterFetch as fetch } from "@better-fetch/fetch";
import { SvelteMap } from "svelte/reactivity";
import * as cache from "tauri-plugin-cache-api";
import { ApiError } from "$lib/errors/api-error";
import { sendTwitch } from "$lib/graphql";
import { globalBadgesQuery } from "$lib/graphql/twitch";
import { Badge } from "$lib/models/badge";
import type { BttvBadge, ChatterinoBadge } from "$lib/models/badge";
import { getOrInsert, getOrInsertComputed } from "$lib/util";

interface BttvUser {
	providerId: string;
	badge: BttvBadge;
}

export class BadgeManager extends SvelteMap<string, Badge> {
	/**
	 * A map of user ids to provider-specific badges.
	 */
	public readonly users = new SvelteMap<string, Badge[]>();

	public async fetch(force = false) {
		await this.fetchTwitch(force);
		await this.fetchBttv(force);
		await this.fetchChatterino(force);
	}

	/**
	 * Retrieves the list of global badges and caches them for later use.
	 */
	public async fetchTwitch(force = false) {
		let badges = await cache.get<Badge[]>("global_badges");

		if (force || !badges) {
			if (force) this.clear();

			const { badges: data } = await sendTwitch(globalBadgesQuery);
			badges = data?.flatMap((b) => (b ? [Badge.fromGql(b)] : [])) ?? [];

			// Twitch adds new badges fairly often, so ttl is lower than the
			// global emote cache
			await cache.set("global_badges", badges, { ttl: 3 * 24 * 60 * 60 });
		}

		for (const badge of badges) {
			this.set(badge.id, badge);
		}

		return badges;
	}

	public async fetchBttv(force = false) {
		let response = await cache.get<BttvUser[]>("bttv_badges");

		if (force || !response) {
			if (force) {
				await cache.remove("bttv_badges");
			}

			const { data, error } = await fetch<BttvUser[]>(
				"https://api.betterttv.net/3/cached/badges",
			);

			if (error) {
				throw new ApiError(error.status, error.message ?? error.statusText);
			}

			response = data;
			await cache.set("bttv_badges", response);
		}

		for (const user of response) {
			const id = `bttv:${user.badge.type}`;

			const badge = getOrInsertComputed(this, id, () => {
				return new Badge({
					setId: "bttv",
					version: user.badge.type.toString(),
					title: user.badge.description,
					description: user.badge.description,
					imageUrl: user.badge.svg,
				});
			});

			getOrInsert(this.users, user.providerId, []).push(badge);
		}
	}

	public async fetchChatterino(force = false) {
		let badges = await cache.get<ChatterinoBadge[]>("chatterino_badges");

		if (force || !badges) {
			if (force) {
				await cache.remove("chatterino_badges");
			}

			const { data, error } = await fetch<{ badges: ChatterinoBadge[] }>(
				"https://api.chatterino.com/badges",
			);

			if (error) {
				throw new ApiError(error.status, error.message ?? error.statusText);
			}

			badges = data.badges;
			await cache.set("chatterino_badges", badges);
		}

		for (const data of badges) {
			const setId = data.tooltip.toLowerCase().replace(/\s+/g, "-");

			const badge = new Badge({
				setId,
				version: "1",
				title: data.tooltip,
				description: data.tooltip,
				imageUrl: data.image3,
			});

			for (const id of data.users) {
				getOrInsert(this.users, id, []).push(badge);
			}
		}
	}
}
