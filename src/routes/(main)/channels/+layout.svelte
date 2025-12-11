<script lang="ts">
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import { settings } from "$lib/settings";

	const { children } = $props();

	async function handleKeydown(event: KeyboardEvent) {
		if (!(event.metaKey || event.ctrlKey)) return;

		switch (event.key) {
			case "t": {
				if (!app.focused) return;

				if (!app.splits.active) {
					app.splits.root = app.focused.id;
					await goto("/channels/split");
				}

				app.splits.insertEmpty(app.focused.id, settings.state["splits.defaultOrientation"]);
				break;
			}

			case "w": {
				if (app.splits.active && app.splits.focused) {
					event.preventDefault();
					app.splits.remove(app.splits.focused);
				} else if (app.focused) {
					event.preventDefault();

					await app.focused.leave();
					await goto("/");
				}

				break;
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{@render children()}
