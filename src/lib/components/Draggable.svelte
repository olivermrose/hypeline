<script lang="ts">
	import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
	import type { Channel } from "$lib/models/channel.svelte";
	import ChannelListItem from "./ChannelListItem.svelte";
	import StreamTooltip from "./StreamTooltip.svelte";

	interface Props {
		channel: Channel;
		index: number;
	}

	const { channel, index }: Props = $props();

	const { ref, isDragging } = useSortable({
		id: () => channel.id,
		index: () => index,
	});
</script>

<div class="relative px-1.5" {@attach ref}>
	<div class={[isDragging.current && "invisible"]}>
		<StreamTooltip {channel} />
	</div>

	{#if isDragging.current}
		<div class="absolute inset-1.5 flex items-center gap-2 px-1.5 opacity-70">
			<ChannelListItem {channel} />
		</div>
	{/if}
</div>
