import { SvelteMap } from "svelte/reactivity";
import { ApiError } from "$lib/errors";
import { userQuery } from "$lib/graphql";
import type { TwitchApiClient } from "$lib/twitch/client";
import { User } from "$lib/user.svelte";

export interface UserFetchOptions {
	by?: "id" | "login";
	force?: boolean;
}

export class UserManager extends SvelteMap<string, User> {
	readonly #requests = new Map<string, Promise<User>>();

	public constructor(public readonly client: TwitchApiClient) {
		super();
	}

	public async fetch(idOrLogin: string, { by = "id", force = false }: UserFetchOptions = {}) {
		const inProgress = this.#requests.get(idOrLogin);
		if (inProgress) return inProgress;

		const variables = {
			id: null as string | null,
			login: null as string | null,
		};

		if (by === "id") {
			if (!force) {
				const cached = this.get(idOrLogin);
				if (cached) return cached;
			}

			variables.id = idOrLogin;
		} else {
			variables.login = idOrLogin;
		}

		const request = (async () => {
			try {
				const { user: data } = await this.client.send(userQuery, variables);

				if (!data) {
					throw new ApiError(404, `User "${idOrLogin}" not found`);
				}

				const user = new User(this.client, data);

				if (by === "id") {
					this.set(idOrLogin, user);
				}

				return user;
			} finally {
				this.#requests.delete(idOrLogin);
			}
		})();

		this.#requests.set(idOrLogin, request);
		return request;
	}

	public async block(id: string) {
		await this.client.put("/users/blocks", {
			params: {
				target_user_id: id,
			},
		});
	}

	public async unblock(id: string) {
		await this.client.delete("/users/blocks", {
			target_user_id: id,
		});
	}
}
