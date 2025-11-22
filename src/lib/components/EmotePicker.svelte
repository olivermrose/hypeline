<script lang="ts">
	import { Popover, Tabs } from "bits-ui";
	import { onMount } from "svelte";
	import { VList } from "virtua/svelte";
	import { app } from "$lib/app.svelte";
	import type { Emote, EmoteProvider, EmoteSet } from "$lib/emotes";
	import type { Channel } from "$lib/models/channel.svelte";
	import type { User } from "$lib/models/user.svelte";
	import Input from "./ui/Input.svelte";

	type EmoteSetOwner = Pick<User, "id" | "username" | "displayName" | "avatarUrl">;

	interface Props {
		channel: Channel;
		input?: HTMLInputElement | null;
	}

	const { channel, input }: Props = $props();

	// TODO: see if there's a better way to do this
	const mockAccounts: Record<Exclude<EmoteProvider, "Twitch">, EmoteSetOwner> = {
		"7TV": {
			id: "7tv_global",
			username: "7tv_global",
			displayName: "7TV Global",
			avatarUrl:
				"https://static-cdn.jtvnw.net/jtv_user_pictures/96d6ff92-7ad5-4528-8941-2cbab55dd4e1-profile_image-150x150.png",
		},
		BetterTTV: {
			id: "bttv_global",
			username: "bttv_global",
			displayName: "BetterTTV Global",
			avatarUrl: "https://betterttv.com/favicon.png",
		},
		FrankerFaceZ: {
			id: "ffz_global",
			username: "ffz_global",
			displayName: "FrankerFaceZ Global",
			avatarUrl: "https://www.frankerfacez.com/static/images/cover/zreknarf.png",
		},
	};

	let sorted = $state.raw<EmoteSet[]>([]);

	onMount(async () => {
		if (!app.user) return;

		const channelSet = app.user.emoteSets.find((set) => set.owner.id === channel.id);

		if (channelSet) {
			channelSet.emotes.push(...channel.emotes.values().filter((e) => e.provider === "7TV"));
		}

		// const providerGlobals = Map.groupBy(app.emotes.values(), (emote) => emote.provider);

		// for (const [provider, emotes] of providerGlobals) {
		// 	// This is never true but TypeScript needs to believe it to narrow
		// 	if (provider === "Twitch") continue;

		// 	emoteSets.set(provider, {
		// 		owner: mockAccounts[provider],
		// 		global: true,
		// 		emotes,
		// 	});
		// }

		sorted = app.user.emoteSets.toSorted((a, b) => {
			if (a.owner.id === channel.id) return -1;
			if (b.owner.id === channel.id) return 1;

			if (a.global && !b.global) return 1;
			if (!a.global && b.global) return -1;

			return a.owner.username.localeCompare(b.owner.username);
		});
	});

	function appendEmote(name: string) {
		if (!input) return;

		if (input.value.length > 0) {
			input.value += ` ${name}`;
		} else {
			input.value = name;
		}
	}

	function chunk(emotes: Emote[]) {
		const rows = [];

		for (let i = 0; i < emotes.length; i += 7) {
			rows.push(emotes.slice(i, i + 7));
		}

		return rows;
	}
</script>

<Popover.Root>
	<Popover.Trigger
		class="text-muted-foreground hover:text-foreground flex size-10 items-center justify-center transition-colors duration-150"
		aria-label="Open emote picker"
	>
		<span class="lucide--smile iconify size-5"></span>
	</Popover.Trigger>

	<Popover.Portal>
		<Popover.Content
			class="bg-sidebar overflow-hidden rounded-md border"
			side="top"
			sideOffset={12}
			collisionPadding={8}
		>
			<Tabs.Root class="flex max-h-100" orientation="vertical">
				<Tabs.List class="flex flex-col gap-3 overflow-y-auto p-2">
					{#each sorted as set (set.owner.id)}
						<Tabs.Trigger class="group" value={set.owner.displayName}>
							<img
								class="group-data-[state=active]:outline-twitch size-7 rounded-full object-contain group-data-[state=active]:outline-2"
								src={set.owner.avatarUrl}
								alt={set.owner.displayName}
								decoding="async"
								loading="lazy"
							/>
						</Tabs.Trigger>
					{/each}
				</Tabs.List>

				{#each sorted as set (set.owner.id)}
					<Tabs.Content
						class="flex w-[calc(var(--spacing)*56+64px)] flex-col border-l"
						value={set.owner.displayName}
					>
						<Input
							class="focus-visible:outline-input rounded-none rounded-tr-md border-none focus-visible:ring-0"
							type="search"
							placeholder="Search {set.name}..."
						/>

						<VList
							id="emote-vlist"
							class="grow overflow-y-auto border-t p-2"
							data={chunk(set.emotes)}
						>
							{#snippet children(emotes)}
								<div class="emote-row mb-2 flex items-center gap-2">
									{#each emotes as emote (emote.id)}
										<button
											title={emote.name}
											type="button"
											onclick={() => appendEmote(emote.name)}
										>
											<img
												class="size-8 object-contain"
												srcset={emote.srcset.join(", ")}
												alt={emote.name}
												decoding="async"
												loading="lazy"
											/>
										</button>
									{/each}
								</div>
							{/snippet}
						</VList>
					</Tabs.Content>
				{/each}
			</Tabs.Root>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

<style>
	:global(#emote-vlist > div > div:last-child) .emote-row {
		margin-bottom: 0;
	}
</style>
