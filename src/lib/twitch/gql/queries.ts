import type { ResultOf } from "gql.tada";
import { userDetailsFragment } from "./fragments";
import { gql } from "./function";

export const userQuery = gql(
	`query GetUser($id: ID, $login: String) {
		user(id: $id, login: $login) {
			...UserDetails
		}
	}`,
	[userDetailsFragment],
);

export type User = NonNullable<ResultOf<typeof userQuery>["user"]>;
