<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { Popover, Tabs } from "bits-ui";
	import { onMount } from "svelte";
	import { app } from "$lib/app.svelte";
	import type { User } from "$lib/models/user.svelte";
	import type { UserEmote } from "$lib/twitch/api";

	interface EmoteSet {
		owner: User;
		emotes: UserEmote[];
	}

	const { input }: { input?: HTMLInputElement | null } = $props();

	const emoteSets = new Map<string, EmoteSet>();

	let sorted = $state.raw<EmoteSet[]>([]);

	onMount(async () => {
		const emotes = await invoke<UserEmote[]>("get_user_emotes");
		const grouped = Map.groupBy(emotes, (emote) => emote.owner_id || "twitch");

		for (const [id, emotes] of grouped) {
			const owner = await app.twitch.users.fetch(id, {
				by: id === "twitch" ? "login" : "id",
			});

			emoteSets.set(id, { owner, emotes });
		}

		sorted = emoteSets
			.values()
			.toArray()
			.sort((a, b) => {
				if (app.joined) {
					if (a.owner.id === app.joined.id) return -1;
					if (b.owner.id === app.joined.id) return 1;
				}

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
					{#each sorted as set}
						<Tabs.Trigger class="group" value={set.owner.displayName}>
							<img
								class="group-data-[state=active]:outline-twitch size-7 rounded-full group-data-[state=active]:outline-2"
								src={set.owner.avatarUrl}
								alt={set.owner.displayName}
							/>
						</Tabs.Trigger>
					{/each}
				</Tabs.List>

				{#each sorted as set}
					<Tabs.Content
						class="bg-muted grid grid-cols-7 content-start gap-2 overflow-y-auto border-l p-2"
						value={set.owner.displayName}
					>
						{#each set.emotes as emote}
							{@const format = emote.format.includes("animated")
								? "animated"
								: "static"}

							<button title={emote.name} onclick={() => appendEmote(emote.name)}>
								<img
									class="size-8 object-contain"
									src="https://static-cdn.jtvnw.net/emoticons/v2/{emote.id}/{format}/dark/3.0"
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
