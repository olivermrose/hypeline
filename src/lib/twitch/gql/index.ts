export * from "./fragments";
export * from "./function";
export * from "./queries";

export interface GqlResponse<T> {
	data: T;
}
