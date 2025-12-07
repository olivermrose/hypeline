<script lang="ts">
	import "../app.css";
	import { invoke } from "@tauri-apps/api/core";
	import { ModeWatcher } from "mode-watcher";
	import { onMount } from "svelte";
	import TitleBar from "$lib/components/TitleBar.svelte";
	import { log } from "$lib/log";
	import { settings } from "$lib/settings";
	import { injectTheme } from "$lib/themes";

	const { children } = $props();

	onMount(() => {
		injectTheme(settings.state["appearance.theme"]);
	});

	$effect(() => {
		invoke("update_log_level", { level: settings.state["advanced.logs.level"] });
	});

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
