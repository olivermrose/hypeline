<script lang="ts">
	import { RadioGroup } from "bits-ui";
	import { setMode, userPrefersMode } from "mode-watcher";
	import ArrowsClockwise from "~icons/ph/arrows-clockwise";
	import { Label } from "$lib/components/ui/label";

	const themes = [
		{ value: "light", class: "bg-white" },
		{ value: "dark", class: "bg-neutral-950" },
		{ value: "system" },
	];
</script>

<RadioGroup.Root
	class="flex flex-nowrap items-center gap-4"
	bind:value={() => userPrefersMode.current, (value) => setMode(value)}
>
	{#each themes as theme (theme.value)}
		<Label class="flex-col">
			<RadioGroup.Item
				class={[
					"flex size-16 items-center justify-center rounded-lg border",
					theme.class,
					userPrefersMode.current === theme.value && "border-primary border-2",
				]}
				value={theme.value}
			>
				{#if theme.value === "system"}
					<ArrowsClockwise class="text-muted-foreground size-6" />
				{/if}
			</RadioGroup.Item>

			<span class="capitalize">{theme.value}</span>
		</Label>
	{/each}
</RadioGroup.Root>
