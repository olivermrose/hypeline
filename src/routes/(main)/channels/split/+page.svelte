<script lang="ts">
	import { tick } from "svelte";
	import { app } from "$lib/app.svelte.js";
	import SplitNode from "$lib/components/split/SplitNode.svelte";
	import SplitView from "$lib/components/split/SplitView.svelte";
	import { settings } from "$lib/settings";
	import type { SplitDirection } from "$lib/split-layout";

	settings.state.lastJoined = null;

	async function handleSplit(event: KeyboardEvent) {
		if (!app.focused || !(event.metaKey || event.ctrlKey)) return;

		let direction: SplitDirection;

		switch (event.key) {
			case "ArrowUp":
				direction = "up";
				break;
			case "ArrowDown":
				direction = "down";
				break;
			case "ArrowLeft":
				direction = "left";
				break;
			case "ArrowRight":
				direction = "right";
				break;
			case "\\":
				event.preventDefault();
				app.splits.insertEmpty(app.focused.id, "horizontal");

				return;
			default:
				return;
		}

		event.preventDefault();

		const targetId = app.splits.navigate(app.focused.id, direction);

		if (targetId) {
			const channel = app.channels.get(targetId);

			if (channel) {
				app.focused = channel;
				await tick();
				app.focused.chat.input?.focus();
			}
		}
	}
</script>

<svelte:window onkeydown={handleSplit} />

<div class="h-full">
	{#if app.splits.root}
		<SplitNode node={app.splits.root} />
	{:else}
		<SplitView id="blank" />
	{/if}
</div>
