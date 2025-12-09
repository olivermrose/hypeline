<script lang="ts">
	import { app } from "$lib/app.svelte.js";
	import SplitNode from "$lib/components/split/SplitNode.svelte";
	import SplitView from "$lib/components/split/SplitView.svelte";
	import { settings } from "$lib/settings";

	settings.state.lastJoined = null;
</script>

<div class="h-full">
	{#if app.splits.root}
		<SplitNode node={app.splits.root} />
	{:else}
		<SplitView id="blank" />
	{/if}
</div>
