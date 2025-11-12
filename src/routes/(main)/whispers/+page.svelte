<script lang="ts">
	const { data } = $props();
</script>

{#each data.whispers as [id, whisper]}
	<!--  -->
{:else}
	<div class="flex size-full flex-col items-center justify-center p-6 text-center">
		<span class="iconify lucide--message-square-dashed mb-4 size-8"></span>

		<span class="text-lg font-medium">No Whispers</span>
		<p class="text-muted-foreground">Any whispers you receive will appear here</p>
	</div>
{/each}
