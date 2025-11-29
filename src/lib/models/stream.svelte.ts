import { SvelteMap } from "svelte/reactivity";
import type { Stream as ApiStream } from "$lib/graphql/fragments";
import { twitchGql } from "$lib/graphql/function";
import type { TwitchClient } from "$lib/twitch/client";

export interface Guest {
	id: string;
	color: string | null;
	username: string;
	displayName: string;
	avatarUrl: string | null;
	viewers: number | null;
}

export class Stream {
	/**
	 * The date the stream started.
	 */
	public readonly createdAt: Date;

	/**
	 * The title of the stream.
	 */
	public title: string;

	/**
	 * The game being played on the stream.
	 */
	public game: string;

	/**
	 * The number of viewers currently watching the stream.
	 */
	public viewers: number;

	/**
	 * The users participating in the Stream Together session if there is
	 * one active.
	 */
	public readonly guests = new SvelteMap<string, Guest>();

	public constructor(
		public readonly client: TwitchClient,

		/**
		 * The id of the channel the stream is associated with.
		 */
		public readonly channelId: string,
		data: ApiStream | null,
	) {
		this.createdAt = new Date(data?.createdAt ?? 0);
		this.title = $state(data?.title ?? "Untitled");
		this.game = $state(data?.game?.displayName ?? "Unknown");
		this.viewers = $state(data?.viewersCount ?? 0);
	}

	/**
	 * Retrieves the list of guests in the Stream Together session if there is
	 * one active.
	 */
	public async fetchGuests() {
		const { channel } = await this.client.send(
			twitchGql(
				`query GetGuests($id: ID!) {
					channel(id: $id) {
						guestStarSessionCall {
							guests {
								user {
									id
									color: chatColor
									username: login
									displayName
									avatarUrl: profileImageURL(width: 150)
									stream {
										viewersCount
									}
								}
							}
						}
					}
				}`,
			),
			{ id: this.channelId },
		);

		for (const { user } of channel?.guestStarSessionCall?.guests ?? []) {
			if (user.id === this.channelId) continue;

			this.guests.set(user.id, {
				...user,
				viewers: user.stream?.viewersCount ?? null,
			});
		}

		return this.guests;
	}
}
