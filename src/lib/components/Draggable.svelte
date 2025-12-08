<script lang="ts">
	import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
	import type { UseSortableInput } from "@dnd-kit-svelte/svelte/sortable";
	import ChannelListItem from "./ChannelListItem.svelte";
	import StreamTooltip from "./StreamTooltip.svelte";
	import type { ChannelListItemProps } from "./ChannelListItem.svelte";

	const { channel, ...rest }: UseSortableInput & ChannelListItemProps = $props();

	const { ref, isDragging } = useSortable(rest);
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
