import { SvelteMap } from "svelte/reactivity";
// import { app } from "$lib/state.svelte";
import type { TwitchApiClient } from "$lib/twitch/client";
import { userQuery } from "$lib/twitch/gql";
import { User } from "$lib/user.svelte";

export class UserManager extends SvelteMap<string, User> {
	readonly #requests = new Map<string, Promise<User>>();

	public constructor(public readonly client: TwitchApiClient) {
		super();
	}

	public async fetch(idOrLogin: string, type: "id" | "login" = "id") {
		const inProgress = this.#requests.get(idOrLogin);
		if (inProgress) return inProgress;

		const variables = {
			id: null as string | null,
			login: null as string | null,
		};

		if (type === "id") {
			const cached = this.get(idOrLogin);
			if (cached) return cached;

			variables.id = idOrLogin;
		} else {
			variables.login = idOrLogin;
		}

		const request = (async () => {
			try {
				const { data } = await this.client.send(userQuery, variables);

				if (!data.user) {
					throw new Error(`User "${idOrLogin}" not found`);
				}

				const user = new User(data.user);

				if (type === "id") {
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
}
