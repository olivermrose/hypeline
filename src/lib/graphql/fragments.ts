import type { FragmentOf } from "gql.tada";
import { seventvGql, twitchGql } from "./function";

export const badgeDetailsFragment = twitchGql(`
	fragment BadgeDetails on Badge {
		setID
		version
		title
		description
		imageURL(size: QUADRUPLE)
	}
`);

export type Badge = FragmentOf<typeof badgeDetailsFragment>;

export const emoteDetailsFragment = seventvGql(`
	fragment EmoteDetails on Emote {
		id
		defaultName
		images {
			mime
			width
			height
			scale
			url
		}
		flags {
			defaultZeroWidth
		}
	}
`);

export const emoteSetDetailsFragment = seventvGql(
	`fragment EmoteSetDetails on EmoteSet {
		id
		emotes {
			items {
				emote {
					...EmoteDetails
				}
			}
		}
	}`,
	[emoteDetailsFragment],
);

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
