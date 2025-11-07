import { initGraphQLTada } from "gql.tada";

export const twitchGql = initGraphQLTada<{
	disableMasking: true;
	introspection: import("./twitch-env").introspection;
	scalars: {
		Time: string;
	};
}>();

export const seventvGql = initGraphQLTada<{
	disableMasking: true;
	introspection: import("./7tv-env").introspection;
	scalars: {
		Id: string;
		DateTime: string;
	};
}>();
