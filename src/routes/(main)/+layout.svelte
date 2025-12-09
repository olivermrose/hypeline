<script lang="ts">
	import { DragDropProvider, DragOverlay } from "@dnd-kit-svelte/svelte";
	import { move } from "@dnd-kit/helpers";
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import SplitHeader from "$lib/components/split/SplitHeader.svelte";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import { settings } from "$lib/settings";

	const { children } = $props();
</script>

<svelte:window
	onkeydown={async (event) => {
		if ((event.metaKey || event.ctrlKey) && event.key === ",") {
			event.preventDefault();
			await goto("/settings");
		}
	}}
/>

<DragDropProvider
	onDragOver={(event) => {
		if (event.operation.target?.id === "pinned-channels") {
			settings.state.pinned = move(settings.state.pinned, event);
		}
	}}
	onDragEnd={(event) => {
		app.splits.handleDragEnd(event);
	}}
>
	<Tooltip.Provider delayDuration={100}>
		<div class="flex grow overflow-hidden">
			{#if settings.state.user}
				<Sidebar />
			{/if}

			<main class={["bg-accent/15 grow overflow-hidden", settings.state.user && "border-l"]}>
				{@render children()}
			</main>
		</div>
	</Tooltip.Provider>

	<DragOverlay>
		{#snippet children(draggable)}
			{#if draggable.type !== "channel-list-item"}
				<SplitHeader id={draggable.id.toString()} />
			{/if}
		{/snippet}
	</DragOverlay>
</DragDropProvider>
