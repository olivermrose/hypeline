import type { Binding } from "../types";

export function bind<T>(get: () => T, set: (value: T) => void): Binding<T> {
	return { get, set };
}
