<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { Popover, Tabs } from "bits-ui";
	import { onMount } from "svelte";
	import { app } from "$lib/app.svelte";
	import type { Emote, EmoteProvider } from "$lib/emotes";
	import type { Channel } from "$lib/models/channel.svelte";
	import type { User } from "$lib/models/user.svelte";
	import type { UserEmote } from "$lib/twitch/api";

	type EmoteSetOwner = Pick<User, "id" | "username" | "displayName" | "avatarUrl">;

	interface EmoteSet {
		owner: EmoteSetOwner;
		global: boolean;
		emotes: Emote[];
	}

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

	const emoteSets = new Map<string, EmoteSet>();

	let sorted = $state.raw<EmoteSet[]>([]);

	onMount(async () => {
		const providerGlobals = Map.groupBy(app.emotes.values(), (emote) => emote.provider);

		for (const [provider, emotes] of providerGlobals) {
			// This is never true but TypeScript needs to believe it to narrow
			if (provider === "Twitch") continue;

			emoteSets.set(provider, {
				owner: mockAccounts[provider],
				global: true,
				emotes,
			});
		}

		const emotes = await invoke<UserEmote[]>("get_user_emotes");
		const grouped = Map.groupBy(emotes, (emote) => emote.owner_id || "twitch");

		for (const [id, emotes] of grouped) {
			const owner = await app.twitch.users.fetch(id, {
				by: id === "twitch" ? "login" : "id",
			});

			emoteSets.set(id, {
				owner,
				global: id === "twitch",
				emotes: emotes.map((emote) => ({
					provider: "Twitch",
					id: emote.id,
					name: emote.name,
					width: 56,
					height: 56,
					srcset: emote.scale.map(
						(d) =>
							`https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/${d} ${d}x`,
					),
				})),
			});
		}

		sorted = emoteSets
			.values()
			.toArray()
			.sort((a, b) => {
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
			class="overflow-hidden rounded-md border"
			side="top"
			sideOffset={12}
			collisionPadding={8}
		>
			<Tabs.Root class="flex max-h-100" orientation="vertical">
				<Tabs.List class="bg-sidebar flex flex-col gap-3 overflow-y-auto p-2">
					{#each sorted as set (set.owner.id)}
						<Tabs.Trigger class="group" value={set.owner.displayName}>
							<img
								class="group-data-[state=active]:outline-twitch size-7 rounded-full object-contain group-data-[state=active]:outline-2"
								src={set.owner.avatarUrl}
								alt={set.owner.displayName}
							/>
						</Tabs.Trigger>
					{/each}
				</Tabs.List>

				{#each sorted as set (set.owner.id)}
					<Tabs.Content
						class="bg-muted grid grid-cols-7 content-start gap-2 overflow-y-auto border-l p-2"
						value={set.owner.displayName}
					>
						{#each set.emotes as emote (emote.id)}
							<button title={emote.name} onclick={() => appendEmote(emote.name)}>
								<img
									class="size-8 object-contain"
									srcset={emote.srcset.join(", ")}
									alt={emote.name}
								/>
							</button>
						{/each}
					</Tabs.Content>
				{/each}
			</Tabs.Root>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
