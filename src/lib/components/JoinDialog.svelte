<script lang="ts">
	import { Combobox, Dialog } from "bits-ui";
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import { suggestionsQuery } from "$lib/graphql/queries";
	import type { SearchSuggestionChannel } from "$lib/graphql/queries";
	import { Channel } from "$lib/models/channel.svelte";
	import { debounce } from "$lib/util";
	import Input from "./ui/Input.svelte";

	let { open = $bindable(false) } = $props();

	let value = $state("");
	let error = $state<string | null>(null);
	let suggestions = $state<SearchSuggestionChannel[]>([]);

	const suggest = debounce(search, 300);

	$effect(() => {
		if (value) suggest(value);
	});

	async function search(query: string) {
		error = null;
		suggestions = [];

		if (!query) return;

		const { searchSuggestions } = await app.twitch.send(suggestionsQuery, { query });

		for (const edge of searchSuggestions?.edges ?? []) {
			if (edge.node.content?.__typename !== "SearchSuggestionChannel") {
				continue;
			}

			suggestions.push(edge.node.content);
		}
	}

	async function join(event: SubmitEvent) {
		event.preventDefault();

		const form = event.currentTarget as HTMLFormElement;
		const input = form.elements.namedItem("name") as HTMLInputElement;

		let channel = app.channels.find((c) => c.user.username === input.value.toLowerCase());

		if (!channel) {
			try {
				const user = await app.twitch.users.fetch(input.value, { by: "login" });

				channel = new Channel(app.twitch, user);
				channel.ephemeral = true;

				app.channels.push(channel);
			} catch (err) {
				if (err instanceof Error) {
					error = err.message;
				} else {
					error = "An unknown error occurred.";
				}

				return;
			}
		}

		await goto(`/channels/${channel.user.username}`);
		open = false;
	}
</script>

<Dialog.Root
	onOpenChange={(open) => {
		if (!open) {
			value = "";
			error = null;
			suggestions = [];
		}
	}}
	bind:open
>
	<Dialog.Portal>
		<Dialog.Overlay
			class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
		/>

		<Dialog.Content
			class="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-4 shadow-lg duration-200"
		>
			<div>
				<Dialog.Title class="text-xl font-semibold">Join a channel</Dialog.Title>

				<p class="text-muted-foreground text-sm">
					This channel will only last during the current session. Qutting the application
					will automatically leave the channel and remove it from the channel list.
				</p>
			</div>

			<form class="space-y-4" onsubmit={join}>
				<Combobox.Root type="single" loop onValueChange={(v) => (value = v)}>
					<div class="flex flex-col gap-1.5">
						<label class="block text-sm font-medium" for="name"> Channel name </label>

						<Combobox.Input id="name">
							{#snippet child({ props })}
								<Input
									type="text"
									autocapitalize="off"
									autocorrect="off"
									bind:value
									{...props}
								/>
							{/snippet}
						</Combobox.Input>

						{#if error}
							<p class="text-destructive text-xs">{error}</p>
						{/if}
					</div>

					{#if suggestions.length}
						<Combobox.Content
							class="bg-card mt-2 max-h-72 w-(--bits-combobox-anchor-width) min-w-(--bits-combobox-anchor-width) overflow-y-auto rounded-lg border p-1"
						>
							{#each suggestions as channel (channel.id)}
								{@const displayName = channel.user!.displayName}

								<Combobox.Item
									class="data-highlighted:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-1 py-1"
									value={displayName}
								>
									<img
										class="size-6 rounded-full"
										src={channel.profileImageURL}
										alt={displayName}
									/>

									<div class="flex w-full items-center justify-between">
										<span class="text-sm">{displayName}</span>

										{#if channel.isLive}
											<div class="flex items-center text-red-500">
												<div
													class="mr-1 size-2 animate-pulse rounded-full bg-current"
												></div>
												<span class="text-sm font-medium">Live</span>
											</div>
										{/if}
									</div>
								</Combobox.Item>
							{/each}
						</Combobox.Content>
					{/if}

					<div class="flex justify-end">
						<button
							class="bg-twitch rounded-md px-3.5 py-2 text-sm font-medium text-white"
							type="submit"
						>
							Join
						</button>
					</div>
				</Combobox.Root>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
