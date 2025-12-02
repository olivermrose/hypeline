import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { SvelteMap } from "svelte/reactivity";
import { app } from "$lib/app.svelte";
import { transform7tvEmote } from "$lib/emotes";
import type { Emote, EmoteSet } from "$lib/emotes";
import { send7tv as send } from "$lib/graphql";
import {
	emoteSetDetailsFragment,
	guestStarDetailsFragment,
	streamDetailsFragment,
	userDetailsFragment,
} from "$lib/graphql/fragments";
import { seventvGql, twitchGql } from "$lib/graphql/function";
import type { UserEmote } from "$lib/twitch/api";
import { User } from "./user.svelte";
import type { Whisper } from "./whisper.svelte";

export class CurrentUser extends User {
	public seventvId: string | null = null;
	public banned = $state(false);

	/**
	 * The ids of the channels the current user moderates for.
	 */
	public readonly moderating = new Set<string>();

	/**
	 * The whisper threads the current user is involved in.
	 */
	public readonly whispers = new SvelteMap<string, Whisper>();

	/**
	 * The emote sets the current user is entitled to use.
	 */
	public readonly emoteSets = new SvelteMap<string, EmoteSet>();

	public constructor(user: User) {
		super(user.client, user.data);
	}

	public async fetchEmoteSets() {
		await invoke("get_user_emotes");
		await this.#fetch7tvSets();

		await listen<UserEmote[]>("useremotes", async (event) => {
			const grouped = Map.groupBy(event.payload, (emote) => emote.owner_id || "twitch");

			for (const [id, emotes] of grouped) {
				const owner = await app.twitch.users.fetch(id, {
					by: id === "twitch" ? "login" : "id",
				});

				const mapped = emotes.map<Emote>((emote) => ({
					provider: "Twitch",
					id: emote.id,
					name: emote.name,
					width: 56,
					height: 56,
					srcset: emote.scale.map(
						(d) =>
							`https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/${d} ${d}x`,
					),
				}));

				this.emoteSets.set(id, {
					id,
					name: owner.displayName,
					owner,
					global: id === "twitch",
					emotes: mapped,
				});
			}
		});
	}

	/**
	 * Retrieves the list of channels the current user is following.
	 */
	public async fetchFollowing() {
		const { user } = await this.client.send(
			twitchGql(
				`query GetUserFollowing($id: ID!) {
					user(id: $id) {
						follows(first: 100) {
							edges {
								node {
									...UserDetails
									channel {
										...GuestStarDetails
									}
									stream {
										...StreamDetails
									}
								}
							}
						}
					}
				}`,
				[userDetailsFragment, guestStarDetailsFragment, streamDetailsFragment],
			),
			{ id: this.id },
		);

		return user?.follows?.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];
	}

	async #fetch7tvSets() {
		const { users } = await send(
			seventvGql(
				`query GetUserEmoteSets($id: String!) {
					users {
						userByConnection(platform: TWITCH, platformId: $id) {
							id
							personalEmoteSet {
								...EmoteSetDetails
							}
							specialEmoteSets {
								...EmoteSetDetails
							}
						}
					}
				}`,
				[emoteSetDetailsFragment],
			),
			{ id: this.id },
		);

		this.seventvId = users.userByConnection?.id ?? null;

		if (users.userByConnection?.personalEmoteSet) {
			const set = users.userByConnection.personalEmoteSet;

			this.emoteSets.set(set.id, {
				id: set.id,
				name: `${this.displayName}: 7TV Personal Emotes`,
				owner: this,
				global: true,
				emotes: set.emotes.items.map((item) => transform7tvEmote(item.emote, item.alias)),
			});
		}

		if (users.userByConnection?.specialEmoteSets) {
			for (const set of users.userByConnection.specialEmoteSets) {
				this.emoteSets.set(set.id, {
					id: set.id,
					name: set.name,
					owner: this,
					global: true,
					emotes: set.emotes.items.map((item) =>
						transform7tvEmote(item.emote, item.alias),
					),
				});
			}
		}
	}
}
