<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { openUrl } from "@tauri-apps/plugin-opener";
	import * as HoverCard from "$lib/components/ui/hover-card";
	import type { LinkNode } from "$lib/message";

	interface Props {
		node: LinkNode;
		preview: boolean;
	}

	interface Seo {
		title: string | null;
		description: string | null;
		image: string | null;
	}

	const { node, preview }: Props = $props();

	function extractSeo() {
		return invoke<Seo | null>("extract_seo", { url: node.data.url.toString() });
	}
</script>

{#if preview}
	{#await extractSeo() then seo}
		{#if seo}
			<HoverCard.Root openDelay={350}>
				<HoverCard.Trigger>
					{#snippet child({ props })}
						{@render link(props)}
					{/snippet}
				</HoverCard.Trigger>

				<HoverCard.Content class="bg-secondary">
					<img
						class="mb-2 aspect-[120/63] w-full rounded border object-cover"
						src={seo.image}
						alt={seo.title ?? ""}
					/>

					<p class="line-clamp-2 truncate text-sm font-semibold">
						{seo.title}
					</p>

					<p class="text-muted-foreground text-xs">
						{seo.description}
					</p>
				</HoverCard.Content>
			</HoverCard.Root>
		{:else}
			{@render link()}
		{/if}
	{/await}
{:else}
	{@render link()}
{/if}

{#snippet link(props: Record<string, unknown> = {})}
	<svelte:element
		this={node.marked ? "mark" : "span"}
		{...props}
		class={["wrap-anywhere underline hover:cursor-pointer", !node.marked && "text-twitch-link"]}
		role="link"
		tabindex="-1"
		onclick={() => openUrl(node.data.url.toString())}
	>
		{node.value}
	</svelte:element>
{/snippet}
