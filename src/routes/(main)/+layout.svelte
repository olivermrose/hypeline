<script lang="ts">
	import Sidebar from "$lib/components/Sidebar.svelte";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import { settings } from "$lib/settings";

	const { children } = $props();
</script>

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
