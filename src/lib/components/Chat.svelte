<script lang="ts">
	import { Separator } from "bits-ui";
	import { VList } from "virtua/svelte";
	import type { Channel } from "$lib/models/channel.svelte";
	import AutoMod from "./message/AutoMod.svelte";
	import Notification from "./message/Notification.svelte";
	import SystemMessage from "./message/SystemMessage.svelte";
	import UserMessage from "./message/UserMessage.svelte";

	interface Props {
		class?: string;
		channel: Channel;
	}

	// Arbitrary; corresponds to how much of the bottom of the chat needs to be
	// visible (smaller = more, larger = less).
	const TOLERANCE = 15;

	const { class: className, channel }: Props = $props();

	let list = $state<VList<any>>();
	let scrollingPaused = $state(false);
	let countSnapshot = $state(0);

	const newMessageCount = $derived.by(() => {
		if (!list) return "0";

		const total = channel.messages.length - countSnapshot;
		return total > 99 ? "99+" : Math.max(total, 0).toString();
	});

	$effect(() => {
		if (channel.messages.length && !scrollingPaused) {
			scrollToEnd();
		}
	});

	function scrollToEnd() {
		list?.scrollToIndex(channel.messages.length - 1, { align: "end" });
	}

	function handleScroll(offset: number) {
		if (!list) return;

		const atBottom = offset >= list.getScrollSize() - list.getViewportSize() - TOLERANCE;

		if (!atBottom && !scrollingPaused) {
			countSnapshot = channel.messages.length;
		}

		scrollingPaused = !atBottom;
	}
</script>

<svelte:window
	onresize={() => {
		if (!scrollingPaused) scrollToEnd();
	}}
/>

<div class="relative h-full">
	{#if scrollingPaused}
		<button
			class="bg-twitch/40 absolute bottom-0 z-10 flex w-full items-center justify-center rounded-t-md border px-2 py-1 text-xs font-medium backdrop-blur-lg"
			type="button"
			onclick={scrollToEnd}
		>
			Scrolling paused

			{#if newMessageCount !== "0"}
				({newMessageCount} new messages)
			{/if}
		</button>
	{/if}

	<VList
		class="{className} overflow-y-auto text-sm"
		data={channel.messages}
		getKey={(message) => message.id}
		onscroll={handleScroll}
		bind:this={list}
	>
		{#snippet children(message, i)}
			{@const prev = channel.messages[i - 1]}
			{@const isNewDay = prev && prev.timestamp.getDate() !== message.timestamp.getDate()}

			{#if isNewDay}
				<div class="relative px-3.5">
					<Separator.Root class="bg-muted my-4 h-px w-full rounded-full" />

					<div
						class="bg-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs font-semibold uppercase"
					>
						<time
							class="text-muted-foreground/90"
							datetime={message.timestamp.toISOString()}
						>
							{message.timestamp.toLocaleDateString(navigator.languages, {
								dateStyle: "long",
							})}
						</time>
					</div>
				</div>
			{/if}

			{#if message.isSystem()}
				<SystemMessage {message} context={message.context} />
			{:else if message.isUser()}
				{#if message.event}
					<Notification {message} />
				{:else if message.autoMod}
					<AutoMod {message} metadata={message.autoMod} />
				{:else}
					<UserMessage
						{message}
						onEmbedLoad={() => {
							if (!scrollingPaused) scrollToEnd();
						}}
					/>
				{/if}
			{/if}

			{@const next = channel.messages.at(i + 1)}

			{#if message.recent && !next?.recent}
				<div class="text-twitch relative px-3.5">
					<Separator.Root class="my-4 h-px w-full rounded-full bg-current" />

					<div
						class="bg-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs font-semibold uppercase"
					>
						Live messages
					</div>
				</div>
			{/if}
		{/snippet}
	</VList>
</div>
