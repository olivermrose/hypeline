<script lang="ts">
	import { onMount } from "svelte";
	import WarningCircle from "~icons/ph/warning-circle";
	import { page } from "$app/state";
	import Link from "$lib/components/Link.svelte";
	import { log } from "$lib/log";

	onMount(() => {
		if (page.error) {
			log.error(`[${page.status}]: ${page.error.message}`);
		}
	});
</script>

<div class="flex size-full flex-col items-center justify-center p-6 text-center">
	<WarningCircle class="mb-4 size-8" />

	<span class="text-lg font-medium">This is awkward...</span>

	<p class="text-muted-foreground mt-1 max-w-md">
		Something went wrong. If this issue persists, please file an issue on the <Link
			href="https://github.com/olivermrose/hypeline">GitHub repository</Link
		>.
	</p>
</div>
