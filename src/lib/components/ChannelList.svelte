<script lang="ts">
	import { onMount } from "svelte";
	import { flip } from "svelte/animate";
	import { log } from "$lib/log";
	import { app } from "$lib/state.svelte";
	import ChannelIcon from "./ChannelIcon.svelte";

	const groups = $derived.by(() => {
		const sorted = app.channels.toSorted((a, b) => {
			if (a.stream && b.stream) {
				return (b.stream.viewersCount ?? 0) - (a.stream.viewersCount ?? 0);
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

				const ids = app.channels.map((c) => c.user.id);
				const streams = await app.twitch.fetchStreams(ids);

				for (const channel of app.channels) {
					const stream = streams.find((s) => s.broadcaster?.id === channel.user.id);
					channel.stream = stream ?? null;
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
