<script lang="ts">
	import { Accordion, Popover } from "bits-ui";
	import { onMount } from "svelte";
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
	let open = $derived(sorted.filter((set) => set.owner.id === channel.id).map((set) => set.id));

	onMount(async () => {
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
	});

	$effect(() => {
		if (!app.user) return;

		if (channel.emoteSetId && !app.user.emoteSets.has(channel.emoteSetId)) {
			app.user.emoteSets.set(channel.emoteSetId, {
				id: channel.emoteSetId,
				name: `7TV: ${channel.user.displayName}`,
				owner: channel.user,
				global: false,
				emotes: channel.emotes
					.values()
					.filter((emote) => emote.provider === "7TV" && !emote.global)
					.toArray(),
			});
		}

		sorted = app.user.emoteSets
			.values()
			.toArray()
			.toSorted((a, b) => {
				if (a.owner.id === channel.id) return -1;
				if (b.owner.id === channel.id) return 1;

				if (a.global && !b.global) return 1;
				if (!a.global && b.global) return -1;

				return a.owner.username.localeCompare(b.owner.username);
			});

		return () => {
			if (channel.emoteSetId) {
				app.user?.emoteSets.delete(channel.emoteSetId);
			}
		};
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

	function scrollToSet(id: string) {
		if (!open.includes(id)) {
			open = [...open, id];
		}

		document.getElementById(id)?.scrollIntoView();
	}

	function toImageSet(srcset: string[]) {
		const candidates: string[] = [];

		for (const src of srcset) {
			const [url, density] = src.split(" ");
			candidates.push(`url("${url}") ${density}`);
		}

		return `image-set(${candidates.join(", ")})`;
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
			class="bg-sidebar flex max-h-100 overflow-hidden rounded-md border"
			side="top"
			sideOffset={12}
			collisionPadding={8}
		>
			<nav class="flex flex-col gap-3 overflow-y-auto p-2">
				{#each sorted as set (set.id)}
					<button class="group" type="button" onclick={() => scrollToSet(set.id)}>
						<img
							class="group-data-[state=active]:outline-twitch size-7 rounded-full object-contain group-data-[state=active]:outline-2"
							src={set.owner.avatarUrl}
							alt={set.owner.displayName}
							decoding="async"
							loading="lazy"
						/>
					</button>
				{/each}
			</nav>

			<div class="flex w-md flex-col border-l">
				<Input
					class="border-border focus-visible:border-border shrink-0 rounded-none rounded-tr-md border-0 border-b focus-visible:ring-0"
					type="search"
					placeholder="Search..."
				/>

				<Accordion.Root class="divide-y overflow-y-auto" type="multiple" bind:value={open}>
					{#each sorted as set (set.id)}
						<Accordion.Item id={set.id} class="group flex flex-col" value={set.id}>
							<Accordion.Header class="bg-sidebar sticky top-0 z-10 p-2">
								<Accordion.Trigger class="group flex items-center gap-2">
									<img
										class="size-6 rounded-full object-contain"
										src={set.owner.avatarUrl}
										alt={set.owner.displayName}
										decoding="async"
										loading="lazy"
									/>

									<span class="text-sm">{set.name}</span>
									<span
										class="iconify lucide--chevron-right text-muted-foreground group-data-[state=open]:rotate-90"
									></span>
								</Accordion.Trigger>
							</Accordion.Header>

							{#if open.includes(set.id)}
								<Accordion.Content class="grid grid-cols-9 gap-1.5 px-2 pb-2">
									{#each set.emotes as emote (emote.id)}
										<button
											class="w-full"
											title={emote.name}
											type="button"
											onclick={() => appendEmote(emote.name)}
										>
											<div
												class="aspect-square w-full bg-contain bg-center bg-no-repeat"
												style:background-image={toImageSet(emote.srcset)}
											></div>
										</button>
									{/each}
								</Accordion.Content>
							{/if}
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
