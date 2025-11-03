import type { FragmentOf } from "gql.tada";
import { gql } from "./function";

export const streamDetailsFragment = gql(`
	fragment StreamDetails on Stream {
		broadcaster {
			id
		}
		title
		game {
			displayName
		}
		viewersCount
		createdAt
	}
`);

export type Stream = FragmentOf<typeof streamDetailsFragment>;

export const userDetailsFragment = gql(`
	fragment UserDetails on User {
		id
		createdAt
		login
		displayName
		description
		chatColor
		profileImageURL(width: 300)
		bannerImageURL
		roles {
			isStaff
			isAffiliate
			isPartner
		}
	}
`);
