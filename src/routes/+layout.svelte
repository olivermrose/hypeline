<script lang="ts">
	import "../app.css";
	import { ModeWatcher } from "mode-watcher";
	import TitleBar from "$lib/components/TitleBar.svelte";
	import { log } from "$lib/log";

	const { children } = $props();

	addEventListener("error", (event) => {
		if (event.message.startsWith("ResizeObserver loop")) {
			event.preventDefault();
			return;
		}

		log.error(`[${event.filename}@${event.lineno}:${event.colno}] ${event.message}`);
	});

	addEventListener("unhandledrejection", (event) => {
		log.error(`Unhandled promise rejection: ${event.reason}`);

		if (event.reason instanceof AggregateError) {
			for (const error of event.reason.errors) {
				log.error(`\t- ${error.message}`);
			}
		}
	});
</script>

<ModeWatcher />

<div class="flex h-screen flex-col overflow-hidden">
	<TitleBar />

	{@render children()}
</div>
