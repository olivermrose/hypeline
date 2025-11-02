<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { settings } from "$lib/settings";
	import { connect } from "$lib/twitch";

	let loading = $state(true);

	onMount(async () => {
		await connect();

		if (settings.state.lastJoined) {
			await goto(`/channels/${settings.state.lastJoined}`);
		}

		loading = false;
	});
</script>

{#if loading}
	<div class="flex size-full items-center justify-center gap-x-2 text-lg">
		<span class="iconify lucide--loader-circle size-6 animate-spin"></span>
		Loading
	</div>
{:else}
	<div class="flex size-full flex-col items-center justify-center p-6 text-center">
		<span class="iconify lucide--ghost mb-4 size-8"></span>

		<span class="text-lg font-medium">No Channel Selected</span>
		<p class="text-muted-foreground">
			Select a channel from your following list to start chatting
		</p>
	</div>
{/if}
