import type { Component, ComponentProps } from "svelte";
import type { Message } from "../chat.svelte";

export class ComponentMessage<C extends Component> implements Message {
	public readonly id = crypto.randomUUID();
	public readonly timestamp = new Date();

	public constructor(
		public readonly component: C,
		public readonly props: ComponentProps<C> = {} as never,
	) {}
}
