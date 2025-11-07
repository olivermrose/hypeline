import { PUBLIC_TWITCH_CLIENT_ID } from "$env/static/public";
import { app } from "$lib/app.svelte";
import { ApiError } from "$lib/errors";
import { UserManager } from "$lib/managers";
import {
	globalBadgesQuery,
	twitchGql as gql,
	sendTwitch as send,
	streamDetailsFragment,
	userDetailsFragment,
} from "../graphql";
import type { Stream } from "../graphql";
import type { Stream as HelixStream } from "./api";

type QueryParams = Record<string, string | number | (string | number)[]>;

interface FetchOptions {
	params?: QueryParams;
	body?: Record<string, any>;
}

export class TwitchApiClient {
	// This should only be null between the time of app start up and settings
	// synchronization because of browser restrictions; however, any subsequent
	// API calls SHOULD have a valid token as it's set at first layout load.
	public token: string | null = null;

	public readonly users = new UserManager(this);

	/**
	 * Retrieves the list of global badges and caches them for later use.
	 */
	public async fetchBadges() {
		const { badges: data } = await this.send(globalBadgesQuery);
		const badges = data?.filter((b) => b != null) ?? [];

		for (const badge of badges) {
			app.globalBadges.set(`${badge.setID}:${badge.version}`, badge);
		}

		return badges;
	}

	/**
	 * Retrieves the list of channels the current user is following.
	 */
	public async fetchFollowing() {
		if (!app.user) {
			throw new Error("User is not logged in");
		}

		const { user } = await this.send(
			gql(
				`query GetUserFollowing($id: ID!) {
					user(id: $id) {
						follows(first: 100) {
							edges {
								node {
									...UserDetails
									stream {
										...StreamDetails
									}
								}
							}
						}
					}
				}`,
				[userDetailsFragment, streamDetailsFragment],
			),
			{ id: app.user.id },
		);

		return user?.follows?.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];
	}

	/**
	 * Retrieves the stream of the specified channel if it's live.
	 */
	public async fetchStream(id: string) {
		const { user } = await this.send(
			gql(
				`query GetStream($id: ID!) {
					user(id: $id) {
						stream {
							...StreamDetails
						}
					}
				}`,
				[streamDetailsFragment],
			),
			{ id },
		);

		if (!user) {
			throw new Error("User not found");
		}

		return user.stream;
	}

	/**
	 * Retrieves the streams of the specified channels if they're live.
	 */
	public async fetchStreams(ids: string[]) {
		const response = await this.get<HelixStream[]>("/streams", { user_id: ids });
		const streams: Stream[] = [];

		for (const stream of response.data) {
			streams.push({
				broadcaster: {
					id: stream.user_id,
				},
				title: stream.title,
				game: {
					displayName: stream.game_name,
				},
				viewersCount: stream.viewer_count,
				createdAt: stream.started_at,
			});
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

		const response = await fetch(url, {
			method,
			headers: {
				Authorization: `Bearer ${this.token}`,
				"Client-Id": PUBLIC_TWITCH_CLIENT_ID,
				"Content-Type": "application/json",
			},
			body: options.body ? JSON.stringify(options.body) : undefined,
		});

		if (response.status === 204 || response.headers.get("Content-Length") === "0") {
			return { data: null! };
		}

		const data = await response.json();

		if (response.status >= 400 && response.status < 500) {
			throw new ApiError(response.status, data.message);
		}

		return data;
	}
}
