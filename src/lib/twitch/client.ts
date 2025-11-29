import { PUBLIC_TWITCH_CLIENT_ID } from "$env/static/public";
import { ApiError } from "$lib/errors/api-error";
import { sendTwitch as send } from "$lib/graphql";
import { globalBadgesQuery } from "$lib/graphql/queries";
import { UserManager } from "$lib/managers/user-manager";
import { Stream } from "$lib/models/stream.svelte";
import { dedupe } from "$lib/util";
import type { Badge } from "../graphql/fragments";
import type { Stream as HelixStream } from "./api";

type QueryParams = Record<string, string | number | (string | number)[]>;

interface FetchOptions {
	params?: QueryParams;
	body?: Record<string, any>;
}

export class TwitchClient {
	// This should only be null between the time of app start up and settings
	// synchronization because of browser restrictions; however, any subsequent
	// API calls SHOULD have a valid token as it's set at first layout load.
	public token: string | null = null;

	public readonly badges = new Map<string, Badge>();
	public readonly users = new UserManager(this);

	/**
	 * Retrieves the list of global badges and caches them for later use.
	 */
	public async fetchBadges() {
		const { badges: data } = await this.send(globalBadgesQuery);
		const badges = data?.filter((b) => b != null) ?? [];

		for (const badge of badges) {
			this.badges.set(`${badge.setID}:${badge.version}`, badge);
		}

		return badges;
	}

	/**
	 * Retrieves the streams of the specified channels if they're live.
	 */
	public async fetchStreams(ids: string[]) {
		const response = await this.get<HelixStream[]>("/streams", { user_id: ids });
		const streams: Stream[] = [];

		for (const stream of response.data) {
			streams.push(
				new Stream(this, stream.user_id, {
					title: stream.title,
					game: {
						displayName: stream.game_name,
					},
					viewersCount: stream.viewer_count,
					createdAt: stream.started_at,
				}),
			);
		}

		return streams;
	}

	// General HTTP helpers

	// GraphQL only
	public send = send;

	public get<T>(path: `/${string}`, params?: QueryParams) {
		return this.fetch<T>("GET", path, { params });
	}

	public post<T>(path: `/${string}`, options?: FetchOptions) {
		return this.fetch<T>("POST", path, options);
	}

	public put<T>(path: `/${string}`, options?: FetchOptions) {
		return this.fetch<T>("PUT", path, options);
	}

	public patch<T>(path: `/${string}`, options?: FetchOptions) {
		return this.fetch<T>("PATCH", path, options);
	}

	public delete(path: `/${string}`, params?: QueryParams) {
		return this.fetch<never>("DELETE", path, { params });
	}

	public async fetch<T>(
		method: string,
		path: string,
		options: FetchOptions = {},
	): Promise<{ data: T }> {
		const url = new URL(`https://api.twitch.tv/helix${path}`);

		if (options.params) {
			for (const [key, value] of Object.entries(options.params)) {
				if (Array.isArray(value)) {
					for (const v of value) {
						url.searchParams.append(key, v.toString());
					}
				} else {
					url.searchParams.append(key, value.toString());
				}
			}
		}

		if (!this.token) {
			throw new ApiError(401, "OAuth token is not set");
		}

		const body = options.body ? JSON.stringify(options.body) : undefined;
		const key = `${method}:${url.toString()}:${body ?? "{}"}`;

		return dedupe(key, async () => {
			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${this.token}`,
					"Client-Id": PUBLIC_TWITCH_CLIENT_ID,
					"Content-Type": "application/json",
				},
				body,
			});

			if (response.status === 204 || response.headers.get("Content-Length") === "0") {
				return { data: null! };
			}

			const data = await response.json();

			if (response.status >= 400 && response.status < 500) {
				throw new ApiError(response.status, data.message);
			}

			return data;
		});
	}
}
