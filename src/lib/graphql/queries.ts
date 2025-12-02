import type { ResultOf } from "gql.tada";
import { badgeDetailsFragment, emoteSetDetailsFragment, userDetailsFragment } from "./fragments";
import { seventvGql, twitchGql } from "./function";

export const activeEmoteSetQuery = seventvGql(
	`query GetActiveEmoteSet($id: String!, $details: Boolean!) {
		users {
			userByConnection(platform: TWITCH, platformId: $id) {
				style {
					activeEmoteSet {
						id
						...EmoteSetDetails @include(if: $details)
					}
				}
			}
		}
	}`,
	[emoteSetDetailsFragment],
);

export type ActiveEmoteSet = NonNullable<
	NonNullable<
		NonNullable<ResultOf<typeof activeEmoteSetQuery>["users"]>["userByConnection"]
	>["style"]["activeEmoteSet"]
>;

export const clipQuery = twitchGql(`
	query GetClip($slug: ID!) {
		clip(slug: $slug) {
			createdAt
			title
			viewCount
			durationSeconds
			url
			thumbnailURL
			curator {
				displayName
			}
		}
	}`);

export type Clip = NonNullable<ResultOf<typeof clipQuery>["clip"]>;

export const globalBadgesQuery = twitchGql(
	`query {
		badges {
			...BadgeDetails
		}
	}`,
	[badgeDetailsFragment],
);

export const suggestionsQuery = twitchGql(`
	query GetSearchSuggestions($query: String!) {
		searchSuggestions(queryFragment: $query, withOfflineChannelContent: true) {
			edges {
				node {
					text
					content {
						__typename
						... on SearchSuggestionChannel {
							id
							isLive
							profileImageURL(width: 50)
							user {
								displayName
							}
						}
					}
				}
			}
		}
	}
`);

export type SearchSuggestion = NonNullable<
	NonNullable<
		NonNullable<ResultOf<typeof suggestionsQuery>["searchSuggestions"]>["edges"]
	>[number]["node"]
>;

export type SearchSuggestionChannel = Extract<
	NonNullable<SearchSuggestion["content"]>,
	{ __typename: "SearchSuggestionChannel" }
>;

export const userQuery = twitchGql(
	`query GetUser($id: ID, $login: String) {
		user(id: $id, login: $login) {
			...UserDetails
		}
	}`,
	[userDetailsFragment],
);

export type User = NonNullable<ResultOf<typeof userQuery>["user"]>;
