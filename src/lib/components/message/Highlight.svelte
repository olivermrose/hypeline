<script lang="ts">
	import type { Snippet } from "svelte";
	import At from "~icons/ph/at";
	import Highlighter from "~icons/ph/highlighter";
	import Repeat from "~icons/ph/repeat";
	import ShieldWarning from "~icons/ph/shield-warning";
	import SketchLogo from "~icons/ph/sketch-logo";
	import Sparkle from "~icons/ph/sparkle";
	import Star from "~icons/ph/star-fill";
	import Sword from "~icons/ph/sword";
	import Video from "~icons/ph/video";
	import type { HighlightConfig, HighlightType } from "$lib/settings";

	interface Props {
		children: Snippet;
		type: HighlightType | "custom";
		highlight: HighlightConfig;
		info?: string;
	}

	const { children, type, highlight, info }: Props = $props();

	const decorations = {
		mention: { icon: At, label: "Mention" },
		new: { icon: Sparkle, label: "First Time Chat" },
		returning: { icon: Repeat, label: "Returning Chatter" },
		suspicious: { icon: ShieldWarning, label: "Suspicious User" },
		broadcaster: { icon: Video, label: "Broadcaster" },
		moderator: { icon: Sword, label: "Moderator" },
		subscriber: { icon: Star, label: "Subscriber" },
		vip: { icon: SketchLogo, label: "VIP" },
		custom: { icon: Highlighter, label: "Custom" },
	};

	const decoration = $derived(decorations[type]);
</script>

{#if highlight.style !== "background"}
	<div
		class="m-1 box-border overflow-hidden rounded-md border"
		style:border-color={highlight.color}
	>
		{#if highlight.style === "default"}
			<div class="bg-muted flex items-center px-2.5 py-1.5 text-xs font-medium">
				<decoration.icon class="mr-2 size-4" />
				{decoration.label}

				{#if info}
					({info})
				{/if}
			</div>
		{/if}

		{@render children()}
	</div>
{:else}
	<div class="bg-(--highlight)/30" style:--highlight={highlight.color}>
		{@render children()}
	</div>
{/if}
