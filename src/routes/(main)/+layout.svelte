<script lang="ts">
	import { Tooltip } from "bits-ui";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import { settings } from "$lib/settings";

	const { children } = $props();
</script>

<Tooltip.Provider delayDuration={100}>
	<div class="flex grow overflow-hidden">
		{#if settings.state.user}
			<Sidebar />
		{/if}

		<main
			class={[
				"grow overflow-hidden",
				settings.state.user && "rounded-tl-lg border-t border-l",
			]}
		>
			{@render children()}
		</main>
	</div>
</Tooltip.Provider>
