<script lang="ts">
	import { onMount } from "svelte";
	import { flip } from "svelte/animate";
	import Users from "~icons/ph/users-bold";
	import { app } from "$lib/app.svelte";
	import { log } from "$lib/log";
	import type { Channel } from "$lib/models/channel.svelte";
	import StreamTooltip from "./StreamTooltip.svelte";
	import { Separator } from "./ui/separator";

	const { collapsed = false } = $props();

	const sorted = $derived(
		app.channels.toSorted((a, b) => {
			if (a.stream && b.stream) {
				return (b.stream.viewersCount ?? 0) - (a.stream.viewersCount ?? 0);
			}

			if (a.stream && !b.stream) return -1;
			if (!a.stream && b.stream) return 1;

			return a.user.username.localeCompare(b.user.username);
		}),
	);

	const groups = $derived.by(() => {
		const ephemeral = { type: "Ephemeral", channels: sorted.filter((c) => c.ephemeral) };

		const online = { type: "Online", channels: [] as Channel[] };
		const offline = { type: "Offline", channels: [] as Channel[] };

		for (const channel of sorted) {
			if (channel.id === app.user?.id || channel.ephemeral) continue;

			if (channel.stream) {
				online.channels.push(channel);
			} else {
				offline.channels.push(channel);
			}
		}

		return [ephemeral, online, offline].filter((g) => g.channels.length);
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

	function formatViewers(viewers: number) {
		if (viewers >= 1000) {
			return `${(viewers / 1000).toFixed(1)}K`;
		}

		return viewers.toString();
	}
</script>

{#each groups as group}
	{#if collapsed}
		<Separator />
	{:else}
		<span class="text-muted-foreground mt-2 inline-block px-2 text-xs font-semibold uppercase">
			{group.type}
		</span>
	{/if}

	{#each group.channels as channel (channel.user.id)}
		<div class="px-1.5" animate:flip={{ duration: 500 }}>
			<StreamTooltip {channel} {collapsed}>
				{#if !collapsed}
					{#if channel.stream}
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between">
								<span class="text-sidebar-foreground truncate text-sm font-medium">
									{channel.user.displayName}
								</span>

								<div
									class="flex items-center gap-1 text-xs font-medium text-red-400"
								>
									<Users />
									{formatViewers(channel.stream.viewersCount ?? 0)}
								</div>
							</div>

							<p class="text-muted-foreground truncate text-xs">
								{channel.stream.game?.displayName}
							</p>
						</div>
					{:else}
						<span class="text-muted-foreground truncate text-sm font-medium">
							{channel.user.displayName}
						</span>
					{/if}
				{/if}
			</StreamTooltip>
		</div>
	{/each}
{/each}
