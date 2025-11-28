<script lang="ts">
	import { app } from "$lib/app.svelte";

	const { children } = $props();

	app.history.reset();
</script>

<main class="relative flex h-full items-center justify-center overflow-hidden">
	<div class="bg-foreground/5 absolute top-0 -left-32 size-96 rounded-full blur-3xl"></div>
	<div class="bg-foreground/5 absolute -right-32 bottom-0 size-96 rounded-full blur-3xl"></div>

	<div class="flex flex-col items-center gap-y-8 px-6 text-center">
		{@render children()}
	</div>
</main>
