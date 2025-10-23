<script lang="ts">
	import { useDroppable } from "@dnd-kit-svelte/svelte";
	import type { UseDraggableInput } from "@dnd-kit-svelte/svelte";
	import type { Snippet } from "svelte";

	interface Props extends UseDraggableInput {
		children: Snippet;
		class?: string;
	}

	const { children, class: className, ...rest }: Props = $props();

	const { ref } = useDroppable(rest);
</script>

<div class={className} {@attach ref}>
	{@render children?.()}
</div>
