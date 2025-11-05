import { initGraphQLTada } from "gql.tada";
import type { introspection } from "../../../graphql-env";

export const gql = initGraphQLTada<{
	disableMasking: true;
	introspection: introspection;
	scalars: {
		Time: string;
	};
}>();
