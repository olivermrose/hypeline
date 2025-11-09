<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { log } from "$lib/log";

	onMount(() => {
		if (page.error) {
			log.error(`[${page.status}]: ${page.error.message}`);
		}
	});
</script>

<div class="flex size-full flex-col items-center justify-center p-6 text-center">
	<span class="iconify lucide--circle-alert mb-4 size-8"></span>

	<span class="text-lg font-medium">This is awkward...</span>

	<p class="text-muted-foreground mt-1 max-w-md">
		Something went wrong. If this issue persists, please file an issue on the <a
			class="text-twitch-link underline"
			href="https://github.com/olivermrose/hypeline">GitHub repository</a
		>.
	</p>
</div>
