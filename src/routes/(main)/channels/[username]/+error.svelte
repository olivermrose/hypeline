<script lang="ts">
	import { page } from "$app/state";

	const username = $derived(page.params.username?.replace("ephemeral:", ""));
</script>

<div class="flex size-full flex-col items-center justify-center p-6 text-center">
	<span class="iconify lucide--ghost mb-4 size-8"></span>

	<span class="text-lg font-medium">Channel Not Found</span>

	<p class="text-muted-foreground mt-1">
		Channel <code
			class="bg-muted relative rounded border px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
			>{username}</code
		> does not exist
	</p>
</div>
