import type { Component, ComponentProps } from "svelte";
import { Message } from "./message";

export class ComponentMessage<C extends Component> extends Message {
	public readonly [Symbol.toStringTag] = "ComponentMessage";

	public readonly id = crypto.randomUUID();
	public readonly timestamp = new Date();

	public constructor(
		public readonly component: C,
		public readonly props: ComponentProps<C> = {} as never,
	) {
		super();
	}
}
