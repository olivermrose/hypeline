<script lang="ts">
	import { app } from "$lib/app.svelte";
	import { settings } from "$lib/settings";
	import type { HighlightType } from "$lib/settings";
	import type { Viewer } from "$lib/viewer.svelte";
	import QuickActions from "../QuickActions.svelte";
	import Highlight from "./Highlight.svelte";
	import Message from "./Message.svelte";
	import type { MessageProps } from "./Message.svelte";

	const { message, onEmbedLoad }: MessageProps = $props();

	let hlType = $state<HighlightType>();
	let info = $state<string>();
	let quickActionsOpen = $state(false);

	const highlights = $derived(settings.state.highlights);

	const customMatched = $derived(
		highlights.custom.find((hl) => {
			if (!hl.pattern.trim()) return false;

			let pattern = hl.regex ? hl.pattern : RegExp.escape(hl.pattern);

			if (hl.wholeWord) {
				pattern = `\\b${pattern}\\b`;
			}

			return new RegExp(pattern, hl.matchCase ? "g" : "gi").test(message.text);
		}),
	);

	const isSelf = message.author.id === app.user?.id;
	const hasMention = message.text.toLowerCase().includes(`@${app.user?.username}`);

	if (message.viewer) {
		if (hasMention) {
			hlType = "mention";
		} else if (message.viewer.new) {
			hlType = "new";
		} else if (message.viewer.returning) {
			hlType = "returning";
		} else if (message.viewer.broadcaster) {
			hlType = "broadcaster";
		} else if (message.viewer.moderator) {
			hlType = "moderator";
		} else if (message.viewer.suspicious) {
			hlType = "suspicious";
		} else if (message.viewer.vip) {
			hlType = "vip";
		} else if (message.viewer.subscriber) {
			hlType = "subscriber";
		}
	}

	if (message.viewer?.suspicious) {
		const likelihood = message.viewer.banEvasion;

		if (message.viewer.monitored) {
			info = "Monitoring";
		} else if (message.viewer.restricted) {
			info = "Restricted";
		} else if (likelihood !== "unknown") {
			const status = likelihood[0].toUpperCase() + likelihood.slice(1);
			info = `${status} Ban Evader`;
		}
	}

	function getMentionStyle(viewer?: Viewer) {
		switch (settings.state.chat.mentionStyle) {
			case "none":
				return null;
			case "colored":
				return `color: ${viewer?.user.color}`;
			case "painted":
				return viewer?.user.style;
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={["group relative", message.deleted && "opacity-30"]}
	onmouseenter={() => (quickActionsOpen = true)}
	onmouseleave={() => (quickActionsOpen = false)}
	aria-disabled={message.deleted}
>
	{#if quickActionsOpen && !message.deleted}
		<QuickActions class="absolute top-0 right-2 -translate-y-1/2" {message} />
	{/if}

	{#if message.highlighted}
		<div
			class="bg-muted/50 my-0.5 border-l-4 p-2"
			style:border-color={message.channel.user.color}
		>
			<Message {message} {onEmbedLoad} />
		</div>
	{:else if highlights.enabled}
		{#if hlType && highlights[hlType].enabled}
			<Highlight type={hlType} {info} highlight={highlights[hlType]}>
				{@render innerMessage(highlights[hlType].style !== "background")}
			</Highlight>
		{:else if customMatched?.enabled && !isSelf}
			<Highlight type="custom" highlight={customMatched}>
				{@render innerMessage(customMatched.style !== "background")}
			</Highlight>
		{:else}
			{@render innerMessage(false)}
		{/if}
	{:else}
		{@render innerMessage(false)}
	{/if}
</div>

{#snippet innerMessage(bordered: boolean)}
	<div class={["not-group-aria-disabled:hover:bg-muted/50 py-2", bordered ? "px-1.5" : "px-3"]}>
		{#if message.reply}
			{@const user = message.channel.viewers.get(message.reply.parent.user.id)}

			<div class="mb-1 flex items-center gap-2">
				<div
					class="border-muted-foreground mt-1 ml-2 h-2 w-6 rounded-tl-lg border-2 border-r-0 border-b-0"
				></div>

				<div class="line-clamp-1 text-xs">
					<span style={getMentionStyle(user)}>
						@{message.reply.parent.user.name}
					</span>:

					<p class="text-muted-foreground inline">
						{message.reply.parent.message_text}
					</p>
				</div>
			</div>
		{/if}

		<Message {message} {onEmbedLoad} />
	</div>
{/snippet}
