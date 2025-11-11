<script lang="ts">
	import type { SettingsCategory } from "$lib/settings";
	import Field from "./Field.svelte";

	const { category }: { category: SettingsCategory } = $props();
</script>

<div class="space-y-6">
	<h1>{category.label}</h1>

	<div class="divide-border divide-y *:py-6 *:first:pt-0 *:last:pb-0">
		{#each category.fields as field}
			<Field {field} />
		{/each}
	</div>
</div>
