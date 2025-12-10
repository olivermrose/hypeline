<script lang="ts">
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";

	const { children } = $props();

	async function handleKeydown(event: KeyboardEvent) {
		if (!app.focused || !(event.metaKey || event.ctrlKey)) return;

		if (event.key === "\\") {
			event.preventDefault();

			if (!app.splits.active) {
				app.splits.root = app.focused.id;
				await goto("/channels/split");
			}

			app.splits.insertEmpty(app.focused.id, "horizontal");
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{@render children()}
