export * from "./fragments";
export * from "./function";
export * from "./queries";

// TODO: split this into a union for error handling
export interface GqlResponse<T> {
	data: T;
}
