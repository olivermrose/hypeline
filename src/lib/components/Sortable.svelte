<script lang="ts">
	import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
	import type { Channel } from "$lib/models/channel.svelte";
	import ChannelListItem from "./ChannelListItem.svelte";

	interface Props {
		channel: Channel;
		index: number;
	}

	const { channel, index }: Props = $props();

	const { ref, isDragging } = useSortable({
		id: () => `${channel.id}:channel-list/pinned`,
		type: "channel-list-item",
		index,
	});
</script>

<ChannelListItem {channel} dragging={isDragging.current} {ref} />
