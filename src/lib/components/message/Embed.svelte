<script lang="ts">
	import { openUrl } from "@tauri-apps/plugin-opener";
	import dayjs from "dayjs";
	import { app } from "$lib/app.svelte";
	import { transform7tvEmote } from "$lib/emotes";
	import { send7tv as send } from "$lib/graphql";
	import { emoteDetailsFragment } from "$lib/graphql/fragments";
	import { seventvGql as gql } from "$lib/graphql/function";
	import { clipQuery } from "$lib/graphql/queries";

	interface Props {
		url: URL;
		tld: ReturnType<typeof import("tldts").parse>;
		onLoad?: () => void;
	}

	const { url, tld, onLoad }: Props = $props();

	let blurred = $state(true);

	async function fetchEmote() {
		const { emotes } = await send(
			gql(
				`query GetEmote($id: Id!){
					emotes {
						emote(id: $id) {
							...EmoteDetails
							flags {
								publicListed
							}
							owner {
								mainConnection {
									platformDisplayName
								}
							}
						}
					}
				}`,
				[emoteDetailsFragment],
			),
			{ id: url.pathname.split("/")[2] },
		);

		if (!emotes.emote) return;
		onLoad?.();

		return {
			...transform7tvEmote(emotes.emote),
			listed: emotes.emote.flags.publicListed,
			owner: emotes.emote.owner,
		};
	}

	async function fetchClip() {
		let slug = url.pathname.split("/")[3];

		if (tld.hostname === "clips.twitch.tv") {
			slug = url.pathname.slice(1);
		}

		const { clip } = await app.twitch.send(clipQuery, { slug });
		onLoad?.();

		return clip;
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
							srcset={emote.srcset.join(", ")}
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
							by {emote.owner?.mainConnection?.platformDisplayName ?? "Unknown"}
						</span>
					</div>
				{/if}
			</div>
		{/await}
	{:else if tld.hostname === "open.spotify.com"}
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
					<img src={clip.thumbnailURL} alt={clip.title} decoding="async" />

					<div class="flex flex-col gap-0.5 overflow-hidden py-1 pr-1">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<span
							class="text-twitch-link truncate text-sm font-medium hover:cursor-pointer"
							role="link"
							tabindex="-1"
							onclick={() => openUrl(clip.url)}
						>
							{clip.title}
						</span>

						<span class="text-muted-foreground text-xs">
							{dayjs(clip.createdAt).format("MMMM D, YYYY")}
						</span>

						<div class="text-muted-foreground flex items-center gap-1 text-xs">
							by {clip.curator?.displayName}

							<span class="text-foreground">&bullet;</span>

							<div class="flex items-center">
								<span class="iconify lucide--eye mr-1"></span>
								{clip.viewCount} views
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/await}
	{/if}
</div>
