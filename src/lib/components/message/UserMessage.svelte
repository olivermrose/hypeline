<script lang="ts">
	import ArrowBendUpRight from "~icons/ph/arrow-bend-up-right";
	import { app } from "$lib/app.svelte";
	import type { Viewer } from "$lib/models/viewer.svelte";
	import { settings } from "$lib/settings";
	import type { HighlightType } from "$lib/settings";
	import Highlight from "./Highlight.svelte";
	import Message from "./Message.svelte";
	import QuickActions from "./QuickActions.svelte";
	import type { MessageProps } from "./Message.svelte";

	const { message, onEmbedLoad }: MessageProps = $props();

	let hlType = $state<HighlightType>();
	let info = $state<string>();

	const highlights = $derived(settings.state.highlights);

	const customMatched = $derived(
		highlights.keywords.find((hl) => {
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
		switch (settings.state.chat.usernames.mentionStyle) {
			case "none":
				return null;
			case "colored":
				return `color: ${viewer?.user.color}`;
			case "painted":
				return viewer?.user.style;
		}
	}
</script>

<div class={["group relative", message.deleted && "opacity-30"]} aria-disabled={message.deleted}>
	{#if !message.deleted && !app.user?.banned}
		<QuickActions
			class="absolute top-0 right-2 -translate-y-1/2 not-group-hover:hidden"
			{message}
		/>
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
			<Highlight type={hlType} {info} config={highlights[hlType]}>
				{@render innerMessage(highlights[hlType].style !== "background")}
			</Highlight>
		{:else if customMatched?.enabled && !isSelf}
			<Highlight type="custom" config={customMatched}>
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

			<div class="mb-0.5 flex items-center gap-2">
				<ArrowBendUpRight class="text-muted-foreground ml-1 shrink-0 scale-x-125" />

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
