<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { openUrl } from "@tauri-apps/plugin-opener";
	import dayjs from "dayjs";
	import type { Emote, EmoteHost } from "$lib/seventv";
	import type { Clip } from "$lib/twitch/api";

	interface Props {
		url: URL;
		tld: ReturnType<typeof import("tldts").parse>;
	}

	const { url, tld }: Props = $props();

	let blurred = $state(true);

	async function fetchEmote() {
		const response = await fetch(`https://7tv.io/v3/emotes/${url.pathname.split("/")[2]}`);
		if (!response.ok) return;

		return response.json() as Promise<Emote>;
	}

	async function fetchClip() {
		let slug = url.pathname.split("/")[3];

		if (tld.hostname === "clips.twitch.tv") {
			slug = url.pathname.slice(1);
		}

		const clip = await invoke<Clip | null>("get_clip", { id: slug });
		return clip;
	}

	function getSrcset(host: EmoteHost) {
		return [
			`https:${host.url}/1x.webp 1x`,
			`https:${host.url}/2x.webp 2x`,
			`https:${host.url}/3x.webp 3x`,
			`https:${host.url}/4x.webp 4x`,
		].join(", ");
	}

	async function openClip(url: string) {
		await openUrl(url);
	}
</script>

<div class="w-full max-w-[400px]">
	{#if tld.domain === "7tv.app"}
		{#await fetchEmote() then emote}
			<div class="bg-sidebar flex h-14 gap-2 overflow-hidden rounded-md border">
				{#if emote}
					<div class="relative h-full shrink-0">
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
								<span class="iconify lucide--eye-off mt-1 size-5"></span>
							</button>
						{/if}
					</div>

					<div class="flex flex-col overflow-hidden py-1 pr-1">
						<div class="flex items-center">
							<span class="truncate text-sm font-medium" title={emote.name}>
								{emote.name}
							</span>

							{#if !emote.listed}
								<span class="ml-1 text-xs text-red-400">(unlisted)</span>
							{/if}
						</div>

						<span class="text-muted-foreground text-xs">
							by {emote.owner.display_name}
						</span>
					</div>
				{/if}
			</div>
		{/await}
	{:else if url.hostname === "open.spotify.com"}
		<div class="overflow-hidden rounded-xl">
			<iframe
				title="Spotify Web Player"
				src="https://open.spotify.com/embed{url.pathname.replace(/\/intl-\w+\//, '/')}"
				width="100%"
				height="80"
				allow="clipboard-write"
				sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
			></iframe>
		</div>
	{:else if tld.domain === "twitch.tv"}
		{#await fetchClip() then clip}
			{#if clip}
				<div class="bg-sidebar flex h-18 gap-2 overflow-hidden rounded-md border">
					<img src={clip.thumbnail_url} alt={clip.title} decoding="async" />

					<div class="flex flex-col gap-0.5 overflow-hidden py-1 pr-1">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<span
							class="text-twitch-link truncate text-sm font-medium hover:cursor-pointer"
							role="link"
							tabindex="-1"
							onclick={() => openClip(clip.url)}
						>
							{clip.title}
						</span>

						<span class="text-muted-foreground text-xs">
							{dayjs(clip.created_at).format("MMMM D, YYYY")}
						</span>

						<div class="text-muted-foreground flex items-center gap-1 text-xs">
							by {clip.creator_name}

							<span class="text-foreground">&bullet;</span>

							<div class="flex items-center">
								<span class="iconify lucide--eye mr-1"></span>
								{clip.view_count} views
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/await}
	{/if}
</div>
