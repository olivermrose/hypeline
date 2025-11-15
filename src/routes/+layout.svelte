<script lang="ts">
	import "../app.css";
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "svelte-sonner";
	import TitleBar from "$lib/components/TitleBar.svelte";

	const { children } = $props();
</script>

<Toaster duration={3000} richColors />
<ModeWatcher />

<div class="flex max-h-screen flex-col">
	<TitleBar />

	{@render children()}
</div>
