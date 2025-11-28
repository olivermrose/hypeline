<script lang="ts">
	import { Combobox } from "bits-ui";
	import { tick } from "svelte";
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
	import { Input } from "./ui/input";
	import { Label } from "./ui/label";

	interface Props {
		children: Snippet;
		class?: string;
	}

	const { children, class: className = "" }: Props = $props();

	let open = $state(false);
	let value = $state("");
	let error = $state<string | null>(null);
	let suggestions = $state<SearchSuggestionChannel[]>([]);

	const suggest = debounce(search, 300);

	$effect(() => suggest(value));

	function reset() {
		value = "";
		error = null;
		suggestions = [];
	}

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

	async function join() {
		if (!value) return;

		try {
			let channel = app.channels.find((c) => c.user.username === value.toLowerCase());

			if (!channel) {
				const user = await app.twitch.users.fetch(value, { by: "login" });

				channel = new Channel(app.twitch, user);
				channel.ephemeral = true;

				app.channels.push(channel);
			}

			await goto(`/channels/${channel.user.username}`);

			open = false;
			reset();
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = "An unknown error occurred.";
			}
		}
	}
</script>

<Dialog.Root
	bind:open={
		() => open,
		(value) => {
			open = value;
			if (!open) reset();
		}
	}
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

			<Combobox.Root
				type="single"
				loop
				onValueChange={async (v) => {
					value = v;
					await tick();
					await join();
				}}
			>
				<div class="flex flex-col gap-2">
					<Label for="name">Channel name</Label>

					<Combobox.Input id="name">
						{#snippet child({ props })}
							<Input
								type="text"
								autocapitalize="off"
								autocorrect="off"
								placeholder="Search for a channel"
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
						class="bg-popover mt-2 max-h-72 w-(--bits-combobox-anchor-width) min-w-(--bits-combobox-anchor-width) overflow-y-auto rounded-lg border p-1"
					>
						{#each suggestions as channel (channel.id)}
							{@const { displayName } = channel.user!}

							<Combobox.Item
								class="data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none"
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
												class="mr-1.5 size-2 animate-pulse rounded-full bg-current"
											></div>

											<span class="text-sm font-medium">Live</span>
										</div>
									{/if}
								</div>
							</Combobox.Item>
						{/each}
					</Combobox.Content>
				{/if}
			</Combobox.Root>

			<Dialog.Footer>
				<Button class="group" onclickwait={join}>
					<Spinner class="hidden animate-spin group-disabled:inline" />

					<span>
						Join<span class="hidden group-disabled:inline">ing</span>
					</span>
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
