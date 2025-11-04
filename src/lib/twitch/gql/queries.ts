import type { ResultOf } from "gql.tada";
import { userDetailsFragment } from "./fragments";
import { gql } from "./function";

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
			imageURL1x: imageURL(size: NORMAL)
			imageURL2x: imageURL(size: DOUBLE)
			imageURL4x: imageURL(size: QUADRUPLE)
			setID
			version
		}
	}`,
);

export type Badge = NonNullable<NonNullable<ResultOf<typeof globalBadgesQuery>["badges"]>[number]>;

export const userQuery = gql(
	`query GetUser($id: ID, $login: String) {
		user(id: $id, login: $login) {
			...UserDetails
		}
	}`,
	[userDetailsFragment],
);

export type User = NonNullable<ResultOf<typeof userQuery>["user"]>;
