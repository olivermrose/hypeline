<script lang="ts">
	import { RadioGroup, Slider, Switch } from "bits-ui";
	import type { SettingsField } from "$lib/settings";
	import Input from "../ui/Input.svelte";
	import Label from "../ui/Label.svelte";
	import Field from "./Field.svelte";

	interface Props {
		field: SettingsField;
		depth?: number;
	}

	const { field, depth = 2 }: Props = $props();

	const heading = `h${depth}`;
</script>

{#if field.type === "group"}
	<div>
		<svelte:element
			this={heading}
			class="mb-4 inline-block font-semibold [h2]:text-xl [h3]:text-lg"
		>
			{field.label}
		</svelte:element>

		<div class="space-y-6">
			{#each field.items as item}
				<Field field={item} depth={depth + 1} />
			{/each}
		</div>
	</div>
{:else if field.type === "custom"}
	<field.component />
{:else if field.type === "input"}
	<div class="flex flex-col gap-2">
		<Label for={field.id}>{field.label}</Label>

		<Input
			id={field.id}
			class="max-w-1/2"
			type="text"
			autocapitalize="off"
			autocomplete="off"
			disabled={field.disabled}
			bind:value={field.model}
		/>

		{@render description(field.description)}
	</div>
{:else if field.type === "radio"}
	<div class="flex flex-col gap-2">
		<Label for={field.id}>{field.label}</Label>

		{@render description(field.description)}

		<RadioGroup.Root
			id={field.id}
			class="group space-y-1 data-disabled:cursor-not-allowed data-disabled:opacity-50"
			disabled={field.disabled}
			bind:value={field.model}
		>
			{#each field.options as option (option.value)}
				<Label
					class="hover:bg-muted has-data-[state=checked]:bg-muted flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-100 hover:cursor-pointer aria-disabled:cursor-not-allowed"
					aria-disabled={field.disabled}
				>
					<RadioGroup.Item
						class="data-[state=checked]:border-twitch data-[state=checked]:bg-foreground size-4 rounded-full border data-[state=checked]:border-5"
						value={option.value}
					/>

					{option.label}
				</Label>
			{/each}
		</RadioGroup.Root>
	</div>
{:else if field.type === "slider"}
	<div>
		<div class="mb-4">
			<Label class="mb-2" for={field.id}>{field.label}</Label>

			{@render description(field.description)}
		</div>

		<Slider.Root
			id={field.id}
			class="relative flex items-center"
			type="single"
			min={field.min}
			max={field.max}
			step={field.step}
			disabled={field.disabled}
			bind:value={field.model}
		>
			<div class="bg-input relative h-1.5 w-full rounded-full hover:cursor-pointer">
				<Slider.Range class="bg-twitch absolute h-full rounded-full" />
			</div>

			<Slider.Thumb
				class="flex size-5 justify-center rounded-full bg-white hover:cursor-grab active:scale-110 active:cursor-grabbing"
				index={0}
			>
				<div class="mt-7 text-center text-xs font-medium">
					{field.model}
				</div>
			</Slider.Thumb>
		</Slider.Root>
	</div>
{:else if field.type === "toggle"}
	<div class="space-y-2">
		<Label class="flex items-center justify-between hover:cursor-pointer" for={field.id}>
			<span class="font-medium">{field.label}</span>

			<Switch.Root
				id={field.id}
				class="data-[state=checked]:bg-twitch data-[state=unchecked]:bg-input h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors"
				bind:checked={field.model}
			>
				<Switch.Thumb
					class="pointer-events-none block size-4.5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
				/>
			</Switch.Root>
		</Label>

		{@render description(field.description)}
	</div>
{/if}

{#snippet description(description?: string)}
	{#if description}
		<p class="text-muted-foreground text-sm">
			{@html description}
		</p>
	{/if}
{/snippet}
