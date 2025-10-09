<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { onMount } from "svelte";
	import { flip } from "svelte/animate";
	import { log } from "$lib/log";
	import { app } from "$lib/state.svelte";
	import type { Stream } from "$lib/twitch/api";
	import ChannelIcon from "./ChannelIcon.svelte";

	const groups = $derived.by(() => {
		const sorted = app.channels.toSorted((a, b) => {
			if (a.stream && b.stream) {
				return b.stream.viewer_count - a.stream.viewer_count;
			}

			if (a.stream && !b.stream) return -1;
			if (!a.stream && b.stream) return 1;

			return a.user.username.localeCompare(b.user.username);
		});

		return Object.groupBy(sorted, (channel) => (channel.ephemeral ? "a" : "b"));
	});

	onMount(() => {
		const interval = setInterval(
			async () => {
				log.info("Updating streams");

				const streams = await invoke<Stream[]>("get_streams", {
					ids: app.channels.map((c) => c.user.id),
				});

				for (const channel of app.channels) {
					const stream = streams.find((s) => s.user_id === channel.user.id);
					channel.setStream(stream ?? null);
				}
			},
			5 * 60 * 1000,
		);

		return () => clearInterval(interval);
	});
</script>

<!-- TODO: include stream with user -->
{#if app.user}
	<ChannelIcon user={app.user} stream={null} />
{/if}

{#each Object.entries(groups)
	.sort((a, b) => a[0].localeCompare(b[0]))
	.map((e) => e[1]) as channels}
	<div class="bg-border h-px" role="separator"></div>

	{#each channels as channel (channel.user.id)}
		<div class="flex" animate:flip={{ duration: 500 }}>
			<ChannelIcon user={channel.user} stream={channel.stream} />
		</div>
	{/each}
{/each}
