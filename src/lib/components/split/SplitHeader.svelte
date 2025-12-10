<script lang="ts">
	import type { Attachment } from "svelte/attachments";
	import SquareHalfBottom from "~icons/ph/square-half-bottom-fill";
	import SquareHalf from "~icons/ph/square-half-fill";
	import X from "~icons/ph/x";
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import { Button } from "../ui/button";

	interface Props {
		id: string;
		handleRef?: Attachment<Element>;
	}

	const { id, handleRef }: Props = $props();

	const channel = $derived(app.channels.get(id));

	async function closeSplit() {
		if (app.splits.root === id) {
			if (channel) {
				await goto(`/channels/${channel.user.username}`);
			} else {
				await goto("/");
			}

			app.splits.root = null;
			return;
		}

		app.splits.remove(id);
		await channel?.leave();
	}
</script>

<div class="z-20 flex items-center justify-between border-b p-1">
	<div
		class="flex h-full flex-1 cursor-grab items-center gap-x-2 overflow-hidden px-1 active:cursor-grabbing"
		{@attach handleRef}
	>
		{#if channel}
			<span class="truncate text-sm font-medium select-none">{channel.user.displayName}</span>
		{/if}
	</div>

	<div class="flex shrink-0 items-center gap-x-1">
		<Button
			class="size-min p-1"
			size="icon-sm"
			variant="ghost"
			onclick={() => {
				app.splits.insertEmpty(id, "horizontal");
			}}
		>
			<SquareHalf />
		</Button>

		<Button
			class="size-min p-1"
			size="icon-sm"
			variant="ghost"
			onclick={() => {
				app.splits.insertEmpty(id, "vertical");
			}}
		>
			<SquareHalfBottom />
		</Button>

		<Button class="size-min p-1" size="icon-sm" variant="ghost" onclick={closeSplit}>
			<X />
		</Button>
	</div>
</div>
