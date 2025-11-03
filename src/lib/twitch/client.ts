import type { TadaDocumentNode } from "gql.tada";
import { print } from "graphql-web-lite";
import { PUBLIC_TWITCH_CLIENT_ID } from "$env/static/public";
import { UserManager } from "$lib/managers";
import { app } from "$lib/state.svelte";
import { gql, streamDetailsFragment, userDetailsFragment } from "./gql";
import type { GqlResponse } from "./gql";

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
	 * Retrieves the list of channels the current user is following.
	 */
	public async fetchFollowing() {
		if (!app.user) {
			throw new Error("User is not logged in");
		}

		const { data } = await this.send(
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

		return data.user!.follows?.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];
	}

	// General HTTP helpers

	// GraphQL only
	public async send<T, U>(query: TadaDocumentNode<T, U>, variables: U): Promise<GqlResponse<T>> {
		const response = await fetch("https://gql.twitch.tv/gql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Client-Id": "kimne78kx3ncx6brgo4mv6wki5h1ko",
			},
			body: JSON.stringify({
				// @ts-expect-error - outdated types
				query: print(query),
				variables,
			}),
		});

		return response.json();
	}

	public async get<T>(path: `/${string}`, params?: QueryParams) {
		return this.fetch<T>("GET", path, { params });
	}

	public async post<T>(path: `/${string}`, options?: FetchOptions) {
		return this.fetch<T>("POST", path, options);
	}

	public async delete(path: `/${string}`, params?: QueryParams) {
		return this.fetch<void>("DELETE", path, { params });
	}

	public async fetch<T>(
		method: string,
		path: string,
		options: { params?: QueryParams; body?: Record<string, any> } = {},
	): Promise<T> {
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
			throw new Error("OAuth token is not set");
		}

		const response = await fetch(url, {
			method,
			headers: {
				Authorization: `Bearer ${this.token}`,
				"Client-Id": PUBLIC_TWITCH_CLIENT_ID,
				"Content-Type": "application/json",
			},
			body: options.body ? JSON.stringify(options.body) : undefined,
		}).then((response) => response.json());

		return response;
	}
}
