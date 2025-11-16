<script lang="ts" module>
	export interface MessageProps {
		message: UserMessage;
		onEmbedLoad?: () => void;
	}
</script>

<script lang="ts">
	import { openUrl } from "@tauri-apps/plugin-opener";
	import { app } from "$lib/app.svelte";
	import type { Badge } from "$lib/graphql/fragments";
	import type { LinkNode } from "$lib/models/message/parse";
	import type { UserMessage } from "$lib/models/message/user-message";
	import Emote from "../Emote.svelte";
	import Timestamp from "../Timestamp.svelte";
	import Tooltip from "../ui/Tooltip.svelte";
	import User from "../User.svelte";
	import Embed from "./Embed.svelte";

	interface Props extends MessageProps {
		nested?: boolean;
	}

	const { message, nested = false, onEmbedLoad }: Props = $props();

	const badges = $state<Badge[]>([]);
	const linkNodes = $derived(message.nodes.filter((n) => n.type === "link"));

	for (const badge of message.badges) {
		const chatBadge = message.channel.badges.get(badge);
		const globalBadge = app.twitch.badges.get(badge);

		const resolved = chatBadge ?? globalBadge;

		if (resolved) {
			badges.push(resolved);
		}
	}

	if (message.author.badge) {
		badges.push(message.author.badge);
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
				src={badge.imageURL}
				alt={badge.description}
				width="18"
				height="18"
			/>
		{/snippet}

		{badge.title}
	</Tooltip>
{/each}

<User {message} {nested} />

<p
	class={["inline", message.action && "italic"]}
	style:color={message.action ? message.author.color : null}
>
	{#each message.nodes as node, i}
		{#if node.type === "link"}
			<svelte:element
				this={node.marked ? "mark" : "span"}
				class={[
					"wrap-anywhere underline hover:cursor-pointer",
					!node.marked && "text-twitch-link",
				]}
				role="link"
				tabindex="-1"
				onclick={() => openUrl(node.data.url.toString())}
			>
				{node.value}
			</svelte:element>
		{:else if node.type === "mention"}
			{#if !message.reply || (message.reply && i > 0)}
				{#if node.marked}
					<mark class="font-semibold wrap-break-word">
						@{node.data.user?.displayName ?? node.value.slice(1)}
					</mark>
				{:else if !node.data.user}
					<span class="font-semibold wrap-break-word">
						{node.value.slice(1)}
					</span>
				{:else}
					<User {message} mention={node} />
				{/if}
			{/if}
		{:else if node.type === "cheer"}
			{#if node.marked}
				<mark class="wrap-anywhere">{node.data.prefix + node.data.bits}</mark>
			{:else}
				{@const srcset = node.data.tier.images.flatMap((img) =>
					img ? [`${img.url} ${img.dpiScale}x`] : [],
				)}

				<img
					class="-my-2 inline-block align-middle"
					srcset={srcset.join(", ")}
					alt="{node.data.prefix} {node.data.bits}"
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

{#if !nested && linkNodes.some(canEmbed)}
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
