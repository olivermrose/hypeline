import { betterFetch as fetch } from "@better-fetch/fetch";
import type { TadaDocumentNode } from "gql.tada";
import { print } from "graphql-web-lite";
import { ApiError } from "$lib/errors";
import { dedupe } from "$lib/util";

export * from "./fragments";
export * from "./function";
export * from "./queries";

// TODO: split this into a union for error handling
export interface GqlResponse<T> {
	data: T;
}

export function sendTwitch<T, U>(query: TadaDocumentNode<T, U>, variables?: U) {
	return send("https://gql.twitch.tv/gql", query, variables);
}

export function send7tv<T, U>(query: TadaDocumentNode<T, U>, variables?: U) {
	return send("https://7tv.io/v4/gql", query, variables);
}

async function send<T, U>(url: string, query: TadaDocumentNode<T, U>, variables?: U) {
	// @ts-expect-error - outdated types
	const queryStr = print(query);
	const varStr = JSON.stringify(variables ?? {});

	return dedupe(`${url}:${queryStr}:${varStr}`, async () => {
		const { data: response, error } = await fetch<GqlResponse<T>>(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(url.includes("twitch")
					? { "Client-Id": "kimne78kx3ncx6brgo4mv6wki5h1ko" }
					: {}),
			},
			body: JSON.stringify({
				query: queryStr,
				variables,
			}),
		});

		if (error) {
			throw new ApiError(error.status, error.statusText);
		}

		return response.data;
	});
}
