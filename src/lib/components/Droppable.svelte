<script lang="ts">
	import { useDroppable } from "@dnd-kit-svelte/svelte";
	import type { UseDroppableInput } from "@dnd-kit-svelte/svelte";
	import { closestCorners } from "@dnd-kit/collision";
	import type { Snippet } from "svelte";

	interface Props extends UseDroppableInput {
		children: Snippet;
		class?: string;
	}

	const { children, class: className, ...rest }: Props = $props();

	const { ref } = useDroppable({
		...rest,
		collisionDetector: () => closestCorners,
	});
</script>

<div class={className} {@attach ref}>
	{@render children()}
</div>
