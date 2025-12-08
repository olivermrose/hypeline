<script lang="ts">
	import { DragDropProvider, DragOverlay } from "@dnd-kit-svelte/svelte";
	import { app } from "$lib/app.svelte.js";
	import SplitNode from "$lib/components/split/SplitNode.svelte";

	const { data } = $props();

	$effect(() => {
		app.splits.root = data.channel.id;
	});
</script>

<div class="size-full">
	<DragDropProvider onDragEnd={(event) => app.splits.handleDragEnd(event)}>
		{#if app.splits.root}
			<SplitNode node={app.splits.root} />
		{:else}
			<div class="text-muted-foreground flex h-full items-center justify-center">
				Empty Split
			</div>
		{/if}

		<DragOverlay>
			{#snippet children(draggable)}
				<div
					class="custom-cursor pointer-events-none flex h-8 items-center justify-center rounded bg-blue-600 text-white opacity-90 shadow-2xl"
				>
					{draggable.id}
				</div>
			{/snippet}
		</DragOverlay>
	</DragDropProvider>
</div>
