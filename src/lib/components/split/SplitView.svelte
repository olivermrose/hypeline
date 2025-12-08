<script lang="ts">
	import { useDraggable, useDroppable } from "@dnd-kit-svelte/svelte";
	import { app } from "$lib/app.svelte";
	import Channel from "../Channel.svelte";
	import SplitHeader from "./SplitHeader.svelte";

	interface Props {
		id: string;
	}

	const { id }: Props = $props();

	const { ref, handleRef, isDragging } = useDraggable({ id: () => id });

	const dropCenter = useDroppable({ id: () => `${id}:center` });
	const dropUp = useDroppable({ id: () => `${id}:up` });
	const dropDown = useDroppable({ id: () => `${id}:down` });
	const dropLeft = useDroppable({ id: () => `${id}:left` });
	const dropRight = useDroppable({ id: () => `${id}:right` });

	const channel = $derived(app.channels.get(id));
</script>

<div class="relative flex size-full flex-col overflow-hidden">
	{#if channel}
		<SplitHeader {channel} {handleRef} />
	{/if}

	<div class={["relative flex-1", isDragging.current && "opacity-50"]} {@attach ref}>
		{#if channel}
			<Channel {channel} />
		{:else}
			<div class="text-muted-foreground flex h-full items-center justify-center">
				Empty Split
			</div>
		{/if}

		{@render dropZone(dropCenter, "inset-0")}
		{@render dropZone(dropUp, "top-0 inset-x-0 h-1/3")}
		{@render dropZone(dropDown, "bottom-0 inset-x-0 h-1/3")}
		{@render dropZone(dropLeft, "left-0 inset-y-0 w-1/3")}
		{@render dropZone(dropRight, "right-0 inset-y-0 w-1/3")}
	</div>
</div>

{#snippet dropZone(dropper: ReturnType<typeof useDroppable>, className: string)}
	<div
		class={[
			"pointer-events-none absolute z-10",
			className,
			dropper.isDropTarget.current && "bg-primary/50",
		]}
		{@attach dropper.ref}
	></div>
{/snippet}
