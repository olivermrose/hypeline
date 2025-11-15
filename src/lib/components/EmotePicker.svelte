<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { Popover, Tabs } from "bits-ui";
	import { onMount } from "svelte";
	import { SvelteMap } from "svelte/reactivity";
	import { app } from "$lib/app.svelte";
	import type { User } from "$lib/models";
	import type { UserEmote } from "$lib/twitch/api";

	interface EmoteSet {
		owner: User;
		emotes: UserEmote[];
	}

	interface Props {
		input?: HTMLInputElement | null;
	}

	const { input }: Props = $props();

	const emoteSets = new SvelteMap<string, EmoteSet>();

	onMount(async () => {
		const emotes = await invoke<UserEmote[]>("get_user_emotes");
		const grouped = SvelteMap.groupBy(emotes, (emote) => emote.owner_id || "global");

		for (const [id, emotes] of grouped) {
			// TODO: handle global "owner"
			if (id === "global") continue;

			const owner = await app.twitch.users.fetch(id, {
				by: id === "twitch" ? "login" : "id",
			});

			emoteSets.set(id, { owner, emotes });
		}
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
			class="bg-muted overflow-hidden rounded-md border"
			side="top"
			sideOffset={12}
			collisionPadding={8}
		>
			<Tabs.Root class="flex" orientation="vertical">
				<Tabs.List
					class="bg-sidebar flex max-h-100 flex-col gap-3 overflow-y-auto border-r p-2"
				>
					{#each emoteSets.values() as set}
						<Tabs.Trigger class="group" value={set.owner.displayName}>
							<img
								class="group-data-[state=active]:outline-twitch size-8 rounded-full group-data-[state=active]:outline-2"
								src={set.owner.avatarUrl}
								alt={set.owner.displayName}
							/>
						</Tabs.Trigger>
					{/each}
				</Tabs.List>

				{#each emoteSets.values() as set}
					<Tabs.Content class="max-h-100 overflow-y-auto" value={set.owner.displayName}>
						<div class="bg-sidebar border-b p-2">
							{set.owner.displayName}'s emotes
						</div>

						<div class="grid grid-cols-6 content-start gap-2 p-2">
							{#each set.emotes as emote}
								{@const format = emote.format.includes("animated")
									? "animated"
									: "static"}

								<button title={emote.name} onclick={() => appendEmote(emote.name)}>
									<img
										class="size-10"
										src="https://static-cdn.jtvnw.net/emoticons/v2/{emote.id}/{format}/dark/3.0"
										alt={emote.name}
									/>
								</button>
							{/each}
						</div>
					</Tabs.Content>
				{/each}
			</Tabs.Root>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
