<script lang="ts">
	import { app } from "$lib/app.svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Field from "$lib/components/ui/field";
	import * as RadioGroup from "$lib/components/ui/radio-group";
	import { Separator } from "$lib/components/ui/separator";
	import { settings } from "$lib/settings";
	import { injectTheme } from "$lib/themes";

	$effect(() => {
		injectTheme(settings.state.theme);
	});
</script>

<Button
	class="place-self-start"
	size="sm"
	disabled={!app.themes.size}
	onclick={() => (settings.state.theme = "")}
>
	Clear selection
</Button>

<RadioGroup.Root bind:value={settings.state.theme}>
	{#each app.themes as [id, theme] (id)}
		<Field.Label for={id}>
			<Field.Field orientation="horizontal">
				<Field.Content>
					<Field.Title>{theme.name}</Field.Title>

					<Field.Description>
						{theme.description}
					</Field.Description>

					<div class="text-muted-foreground flex h-5 items-center gap-x-2 text-xs">
						{theme.author}

						{#if theme.repository}
							<Separator orientation="vertical" />
							<a href={theme.repository} target="_blank">Repository</a>
						{/if}

						<Separator orientation="vertical" />

						v{theme.version}
					</div>
				</Field.Content>

				<RadioGroup.Item {id} value={id} />
			</Field.Field>
		</Field.Label>
	{/each}
</RadioGroup.Root>
