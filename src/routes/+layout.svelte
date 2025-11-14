<script lang="ts">
	import "../app.css";
	import { ModeWatcher } from "mode-watcher";
	import { app } from "$lib/app.svelte";
	import TitleBar from "$lib/components/TitleBar.svelte";

	const { children } = $props();

	const titleBar = $derived({
		icon: app.joined?.user.avatarUrl ?? "/favicon.png",
		title: app.joined?.user.displayName ?? "Hypeline",
	});
</script>

<ModeWatcher />

<div class="flex max-h-screen flex-col">
	<TitleBar title={titleBar.title}>
		{#snippet icon()}
			<img
				class="size-5 rounded-full"
				src={titleBar.icon}
				alt={titleBar.title}
				data-tauri-drag-region
			/>
		{/snippet}
	</TitleBar>

	{@render children()}
</div>
