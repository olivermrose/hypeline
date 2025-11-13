<script lang="ts">
	const { data } = $props();
</script>

{#each data.whisper.messages as message (message.id)}
	<!--  -->
{/each}
