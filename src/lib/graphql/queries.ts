import type { ResultOf } from "gql.tada";
import { userDetailsFragment } from "./fragments";
import { twitchGql as gql } from "./function";

export const clipQuery = gql(`
	query GetClip($slug: ID!) {
		clip(slug: $slug) {
			createdAt
			title
			viewCount
			url
			thumbnailURL
			curator {
				displayName
			}
		}
	}`);

export type Clip = NonNullable<ResultOf<typeof clipQuery>["clip"]>;

export const globalBadgesQuery = gql(
	`query {
		badges {
			title
			description
			imageURL(size: QUADRUPLE)
			setID
			version
		}
	}`,
);

export type Badge = NonNullable<NonNullable<ResultOf<typeof globalBadgesQuery>["badges"]>[number]>;

export const suggestionsQuery = gql(`
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

export const userQuery = gql(
	`query GetUser($id: ID, $login: String) {
		user(id: $id, login: $login) {
			...UserDetails
		}
	}`,
	[userDetailsFragment],
);

export type User = NonNullable<ResultOf<typeof userQuery>["user"]>;
