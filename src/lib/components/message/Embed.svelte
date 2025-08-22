<script lang="ts">
	import type { Emote, EmoteHost } from "$lib/seventv";

	const { url }: { url: URL } = $props();

	let blurred = $state(true);

	async function fetchEmote() {
		const id = /^\/emotes\/(.+)$/i.exec(url.pathname)?.[1];
		if (!id) return;

		const response = await fetch(`https://7tv.io/v3/emotes/${id}`);
		if (!response.ok) return;

		return response.json() as Promise<Emote>;
	}

	function getSrcset(host: EmoteHost) {
		return [
			`https:${host.url}/1x.webp 1x`,
			`https:${host.url}/2x.webp 2x`,
			`https:${host.url}/3x.webp 3x`,
			`https:${host.url}/4x.webp 4x`,
		].join(", ");
	}
</script>

{#if url.hostname === "7tv.app" || url.hostname === "old.7tv.app"}
	<div class="bg-sidebar flex h-12 w-full gap-2 overflow-hidden rounded-md border">
		{#await fetchEmote()}
			<div class="bg-muted size-12 animate-pulse"></div>

			<div class="flex flex-col gap-0.5">
				<span class="bg-muted mt-1 h-2.5 w-20 animate-pulse rounded-full"></span>
				<span class="bg-muted mt-1 h-2 w-48 animate-pulse rounded-full"></span>
				<span class="bg-muted mt-1 h-2 w-32 animate-pulse rounded-full"></span>
			</div>
		{:then emote}
			{#if emote}
				<div class="relative h-full">
					<img
						class="h-full w-auto"
						srcset={getSrcset(emote.host)}
						alt={emote.name}
						decoding="async"
					/>

					{#if !emote.listed && blurred}
						<button
							class="absolute inset-0 backdrop-blur-lg"
							aria-label="Click to view"
							onclick={() => (blurred = false)}
						>
							<span class="iconify lucide--eye-off size-5"></span>
						</button>
					{/if}
				</div>

				<div class="flex flex-col gap-0.5">
					<div class="mt-0.5 flex items-center text-sm font-medium">
						{emote.name}

						{#if !emote.listed}
							<span class="ml-1 text-xs text-red-400">(unlisted)</span>
						{/if}
					</div>

					<span class="text-muted-foreground text-xs">by {emote.owner.display_name}</span>
				</div>
			{/if}
		{/await}
	</div>
{/if}
