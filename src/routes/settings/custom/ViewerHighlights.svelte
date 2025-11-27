<script lang="ts">
	import { Popover } from "bits-ui";
	import ArrowClockwise from "~icons/ph/arrow-clockwise";
	import { Button } from "$lib/components/ui/button";
	import ColorPicker from "$lib/components/ui/ColorPicker.svelte";
	import * as NativeSelect from "$lib/components/ui/native-select";
	import { defaultHighlightTypes, settings } from "$lib/settings";
	import type { HighlightType } from "$lib/settings";
	import { highlightStyles as styles } from "../highlights";

	const highlights = [
		{ label: "Mentions", value: "mention" },
		{ label: "First Time Chats", value: "new" },
		{ label: "Returning Chatters", value: "returning" },
		{ label: "Suspicious Users", value: "suspicious" },
		{ label: "Broadcasters", value: "broadcaster" },
		{ label: "Moderators", value: "moderator" },
		{ label: "Subscribers", value: "subscriber" },
		{ label: "VIPs", value: "vip" },
	] as const;

	function reset(key: HighlightType) {
		settings.state.highlights[key] = defaultHighlightTypes[key];
	}
</script>

<div class="overflow-x-auto">
	<div class="grid min-w-max grid-cols-[repeat(4,auto)] items-center gap-x-3 gap-y-4">
		{#each highlights as highlight}
			{@const hlType = settings.state.highlights[highlight.value]}

			<span class="col-start-1 text-sm font-medium">
				{highlight.label}
			</span>

			<Popover.Root>
				<Popover.Trigger
					class="border-input size-9 shrink-0 justify-self-center rounded-md border bg-(--highlight)"
					--highlight={hlType.color}
				/>

				<Popover.Portal>
					<Popover.Content class="w-60" sideOffset={10}>
						<ColorPicker
							class="bg-popover rounded-md border p-3"
							bind:value={hlType.color}
						/>
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>

			<NativeSelect.Root
				class="min-w-36"
				bind:value={
					() => (hlType.enabled ? hlType.style : "disabled"),
					(value) => {
						if (value === "disabled") {
							hlType.enabled = false;
						} else {
							hlType.enabled = true;
							hlType.style = value;
						}
					}
				}
			>
				{#each styles as style}
					<NativeSelect.Option value={style.value}>
						{style.label}
					</NativeSelect.Option>
				{/each}
			</NativeSelect.Root>

			<Button
				title="Reset"
				size="icon"
				variant="outline"
				aria-label="Reset to default"
				onclick={() => reset(highlight.value)}
			>
				<ArrowClockwise />
			</Button>
		{/each}
	</div>
</div>
