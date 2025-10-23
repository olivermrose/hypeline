<script lang="ts">
	import { DragDropProvider, DragOverlay } from "@dnd-kit-svelte/svelte";
	import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
	import { move } from "@dnd-kit/helpers";
	import { invoke } from "@tauri-apps/api/core";
	import { onMount } from "svelte";
	import { Channel } from "$lib/channel.svelte";
	import { log } from "$lib/log";
	import { app } from "$lib/state.svelte";
	import type { Stream } from "$lib/twitch/api";
	import ChannelIcon from "./ChannelIcon.svelte";
	import Droppable from "./Droppable.svelte";
	import PinnedChannelIcon from "./PinnedChannelIcon.svelte";

	const groups = $derived.by(() => {
		const sorted = app.channels.toSorted((a, b) => {
			if (a.stream && b.stream) {
				return b.stream.viewer_count - a.stream.viewer_count;
			}

			if (a.stream && !b.stream) return -1;
			if (!a.stream && b.stream) return 1;

			return a.user.username.localeCompare(b.user.username);
		});

		return Object.groupBy(sorted, (channel) => {
			if (channel.ephemeral) return "ephemeral";
			if (channel.pinned) return "pinned";

			return "default";
		});
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

<DragDropProvider
	modifiers={[
		// @ts-ignore
		RestrictToVerticalAxis,
	]}
	onDragOver={(event) => {
		if (groups.pinned) {
			groups.pinned = move(groups.pinned, event);
		}
	}}
>
	<!-- TODO: include stream with user -->
	{#if app.user}
		<ChannelIcon user={app.user} stream={null} />
	{/if}

	{@render channelGroup(groups.ephemeral)}

	<div class="bg-border h-px" role="separator"></div>

	{#if groups.pinned}
		<Droppable id="pinned-channels" class="space-y-4">
			{@render channelGroup(groups.pinned)}
		</Droppable>

		<DragOverlay>
			{#snippet children(source)}
				{@const channel = groups.pinned?.find((c) => c.id === source.id)}

				<img
					class={["rounded-full object-cover", !channel?.stream && "grayscale"]}
					src={channel?.user.avatarUrl}
					alt=""
					width="300"
					height="300"
					draggable="false"
				/>
			{/snippet}
		</DragOverlay>

		<div class="bg-border h-px" role="separator"></div>
	{/if}

	{@render channelGroup(groups.default)}
</DragDropProvider>

{#snippet channelGroup(group: Channel[] = [])}
	{#each group as channel, i (channel.id)}
		{#if channel.pinned}
			<PinnedChannelIcon
				id={channel.id}
				index={i}
				user={channel.user}
				stream={channel.stream}
			/>
		{:else}
			<ChannelIcon user={channel.user} stream={channel.stream} />
		{/if}
	{/each}
{/snippet}
