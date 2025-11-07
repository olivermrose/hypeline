import type { FragmentOf } from "gql.tada";
import { seventvGql, twitchGql } from "./function";

export const emoteSetDetailsFragment = seventvGql(`
	fragment EmoteSetDetails on EmoteSet {
		id
		emotes {
			items {
				emote {
					id
					defaultName
					images {
						mime
						width
						height
						url
					}
					flags {
						defaultZeroWidth
					}
				}
			}
		}
	}
`);

export const streamDetailsFragment = twitchGql(`
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

export const userDetailsFragment = twitchGql(`
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
