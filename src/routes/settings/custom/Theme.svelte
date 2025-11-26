<script lang="ts">
	import { Label, RadioGroup } from "bits-ui";
	import { setMode, userPrefersMode } from "mode-watcher";
	import ArrowsClockwise from "~icons/ph/arrows-clockwise";

	const themes = [
		{ value: "light", class: "bg-white" },
		{ value: "dark", class: "bg-neutral-950" },
		{ value: "system", class: "" },
	];
</script>

<RadioGroup.Root
	class="flex items-center gap-4"
	bind:value={() => userPrefersMode.current, (value) => setMode(value)}
>
	{#each themes as theme (theme.value)}
		<Label.Root class="flex flex-col items-center gap-2">
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

			<span class="text-sm font-medium capitalize">
				{theme.value}
			</span>
		</Label.Root>
	{/each}
</RadioGroup.Root>
