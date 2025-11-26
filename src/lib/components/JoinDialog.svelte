<script lang="ts">
	import { Combobox } from "bits-ui";
	import type { Snippet } from "svelte";
	import Spinner from "~icons/ph/spinner";
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import { suggestionsQuery } from "$lib/graphql/queries";
	import type { SearchSuggestionChannel } from "$lib/graphql/queries";
	import { Channel } from "$lib/models/channel.svelte";
	import { debounce } from "$lib/util";
	import { Button } from "./ui/button";
	import * as Dialog from "./ui/dialog";
	import Input from "./ui/Input.svelte";
	import { Label } from "./ui/label";

	interface Props {
		children: Snippet;
		class?: string;
		open?: boolean;
	}

	let { children, class: className = "", open = $bindable(false) }: Props = $props();

	let value = $state("");
	let error = $state<string | null>(null);
	let suggestions = $state<SearchSuggestionChannel[]>([]);
	let joining = $state(false);

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
		joining = true;
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
		joining = false;
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
	<Dialog.Trigger class={className}>
		{@render children()}
	</Dialog.Trigger>

	<Dialog.Portal>
		<Dialog.Overlay />

		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Join a channel</Dialog.Title>

				<Dialog.Description>
					This channel will only last during the current session. Qutting the application
					will automatically leave the channel and remove it from the channel list.
				</Dialog.Description>
			</Dialog.Header>

			<form class="space-y-4" onsubmit={join}>
				<Combobox.Root type="single" loop onValueChange={(v) => (value = v)}>
					<div class="flex flex-col gap-1.5">
						<Label for="name">Channel name</Label>

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
						<Button type="submit" disabled={joining}>
							{#if joining}
								<Spinner class="animate-spin" /> Joining...
							{:else}
								Join
							{/if}
						</Button>
					</div>
				</Combobox.Root>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
