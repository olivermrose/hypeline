<script lang="ts">
	import { goto } from "$app/navigation";
	import Sidebar from "$lib/components/Sidebar.svelte";
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
