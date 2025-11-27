<script lang="ts">
	import type { Snippet } from "svelte";
	import * as Field from "$lib/components/ui/field";
	import { Input } from "$lib/components/ui/input";
	import * as RadioGroup from "$lib/components/ui/radio-group";
	import { Slider } from "$lib/components/ui/slider";
	import { Switch } from "$lib/components/ui/switch";
	import FieldControl from "./FieldControl.svelte";
	import type { SettingsField } from "./types";

	interface Props {
		field: SettingsField;
	}

	const { field }: Props = $props();
</script>

{#if field.type === "group"}
	<Field.Set>
		<Field.Legend>{field.label}</Field.Legend>

		<Field.Group>
			{#each field.fields as subField}
				<FieldControl field={subField} />
			{/each}
		</Field.Group>
	</Field.Set>
{:else if field.type === "custom"}
	<Field.Set>
		<Field.Legend>{field.label}</Field.Legend>

		{@render description(field.description)}

		<field.component />
	</Field.Set>
{:else if field.type === "input"}
	<Field.Field>
		<Field.Label for={field.id}>{field.label}</Field.Label>

		<Input
			id={field.id}
			class="max-w-1/2"
			type="text"
			autocapitalize="off"
			autocomplete="off"
			disabled={field.disabled?.()}
			bind:value={field.binding.get, field.binding.set}
		/>

		{@render description(field.description)}
	</Field.Field>
{:else if field.type === "radio"}
	<Field.Set>
		<Field.Label for={field.id}>{field.label}</Field.Label>

		{@render description(field.description)}

		<RadioGroup.Root
			id={field.id}
			disabled={field.disabled?.()}
			bind:value={field.binding.get, field.binding.set}
		>
			{#each field.options as option (option.value)}
				<Field.Field orientation="horizontal">
					<RadioGroup.Item value={option.value} />

					<Field.Label aria-disabled={field.disabled?.()}>
						{option.label}
					</Field.Label>
				</Field.Field>
			{/each}
		</RadioGroup.Root>
	</Field.Set>
{:else if field.type === "slider"}
	<Field.Field>
		<Field.Label for={field.id}>{field.label}</Field.Label>

		{@render description(field.description)}

		<Slider
			id={field.id}
			class="relative flex items-center"
			type="single"
			min={field.min}
			max={field.max}
			step={field.step}
			disabled={field.disabled?.()}
			bind:value={field.binding.get, field.binding.set}
		/>
	</Field.Field>
{:else if field.type === "toggle"}
	<Field.Field orientation="horizontal">
		<Field.Content>
			<Field.Label for={field.id}>{field.label}</Field.Label>

			{@render description(field.description)}
		</Field.Content>

		<Switch id={field.id} bind:checked={field.binding.get, field.binding.set} />
	</Field.Field>
{/if}

{#snippet description(description?: string | Snippet)}
	{#if description}
		<Field.Description>
			{#if typeof description === "string"}
				{description}
			{:else}
				{@render description()}
			{/if}
		</Field.Description>
	{/if}
{/snippet}
