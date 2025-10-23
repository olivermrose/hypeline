<script lang="ts">
	import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
	import type { UseSortableInput } from "@dnd-kit-svelte/svelte/sortable";
	import type { ChannelIconProps } from "./ChannelIcon.svelte";
	import ChannelIcon from "./ChannelIcon.svelte";

	const { user, stream, ...rest }: ChannelIconProps & UseSortableInput = $props();

	const { ref, isDragging } = useSortable(rest);
</script>

<div class="relative" {@attach ref}>
	<div class={[isDragging.current && "invisible"]}>
		<ChannelIcon {user} {stream} />
	</div>

	{#if isDragging.current}
		<div
			class="bg-twitch/50 outline-twitch absolute inset-0 size-10 rounded-full outline outline-dashed"
		></div>
	{/if}
</div>
