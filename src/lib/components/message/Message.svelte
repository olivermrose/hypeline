<script lang="ts" module>
	export interface MessageProps {
		message: UserMessage;
		onEmbedLoad?: () => void;
	}
</script>

<script lang="ts">
	import type { LinkNode, MentionNode, UserMessage } from "$lib/message";
	import { settings } from "$lib/settings";
	import { app } from "$lib/state.svelte";
	import type { Badge } from "$lib/twitch/api";
	import Emote from "../Emote.svelte";
	import Timestamp from "../Timestamp.svelte";
	import Tooltip from "../ui/Tooltip.svelte";
	import Embed from "./Embed.svelte";
	import Link from "./Link.svelte";

	const { message, onEmbedLoad }: MessageProps = $props();

	const badges = $state<Badge[]>([]);
	const linkNodes = $derived(message.nodes.filter((n) => n.type === "link"));

	for (const badge of message.badges) {
		const chatBadge = app.joined?.badges.get(badge.name)?.[badge.version];
		const globalBadge = app.globalBadges.get(badge.name)?.[badge.version];

		const resolved = chatBadge ?? globalBadge;

		if (resolved) {
			badges.push(resolved);
		}
	}

	if (message.author.badge) {
		badges.push(message.author.badge);
	}

	function getMentionStyle(node: MentionNode) {
		if (node.marked) return null;

		switch (settings.state.chat.mentionStyle) {
			case "none":
				return null;
			case "colored":
				return `color: ${node.data.user?.color}`;
			case "painted":
				return node.data.user?.style;
		}
	}

	function canEmbed(node: LinkNode) {
		return (
			node.data.tld.domain === "7tv.app" ||
			node.data.tld.hostname === "open.spotify.com" ||
			node.data.tld.hostname === "clips.twitch.tv" ||
			(node.data.tld.domain === "twitch.tv" && node.data.url.pathname.includes("/clip/"))
		);
	}
</script>

<Timestamp date={message.timestamp} />

{#each badges as badge (badge.title)}
	<Tooltip class="p-1 text-xs" side="top" sideOffset={4}>
		{#snippet trigger()}
			<img
				class="inline-block align-middle"
				src={badge.image_url_2x}
				alt={badge.description}
				width="18"
				height="18"
			/>
		{/snippet}

		{badge.title}
	</Tooltip>
{/each}

<!-- Formatting is ugly here, but it needs to be in order for the colon to
render properly without an extra space in between. -->
<span class="font-semibold break-words" style={message.author.style}>
	{message.author.displayName}
</span>{#if !message.isAction}:{/if}

<p
	class={["inline", message.isAction && "italic"]}
	style:color={message.isAction ? message.author.color : null}
>
	{#each message.nodes as node, i}
		{#if node.type === "link"}
			<Link {node} preview={!canEmbed(node)} />
		{:else if node.type === "mention"}
			{#if !message.reply || (message.reply && i > 0)}
				<svelte:element
					this={node.marked ? "mark" : "span"}
					class="font-semibold break-words"
					style={getMentionStyle(node)}
				>
					@{node.data.user?.displayName ?? node.value.slice(1)}
				</svelte:element>
			{/if}
		{:else if node.type === "cheer"}
			{#if node.marked}
				<mark class="wrap-anywhere">{node.data.prefix + node.data.bits}</mark>
			{:else}
				<img
					class="-my-2 inline-block align-middle"
					src={node.data.tier.images.dark.animated[2]}
					alt="{node.data.prefix} {node.data.bits}"
					width="32"
					height="32"
				/>

				<span class="font-semibold" style:color={node.data.tier.color}
					>{node.data.bits}</span
				>
			{/if}
		{:else if node.type === "emote"}
			{#if node.marked}
				<mark class="wrap-anywhere">{node.data.emote.name}</mark>
			{:else}
				<Emote emote={node.data.emote} layers={node.data.layers} />
			{/if}
		{:else}
			<svelte:element this={node.marked ? "mark" : "span"} class="wrap-anywhere">
				{node.value}
			</svelte:element>
		{/if}
	{/each}
</p>

{#if linkNodes.some(canEmbed)}
	<div class="mt-2 flex gap-2">
		{#each linkNodes as node}
			<Embed onLoad={onEmbedLoad} {...node.data} />
		{/each}
	</div>
{/if}

<style>
	mark {
		color: white;
		background-color: --alpha(var(--color-red-500) / 40%);
	}
</style>
