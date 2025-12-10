<script lang="ts">
	import { onMount } from "svelte";
	import ChatDots from "~icons/ph/chat-dots";
	import Spinner from "~icons/ph/spinner";
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import JoinDialog from "$lib/components/JoinDialog.svelte";
	import { buttonVariants } from "$lib/components/ui/button";
	import * as Empty from "$lib/components/ui/empty";
	import { settings } from "$lib/settings";
	import { layout } from "$lib/stores";

	let loading = $state(true);

	onMount(async () => {
		await app.connect();

		if (app.user && !app.user.emoteSets.size) {
			await app.user.fetchEmoteSets();
		}

		if (layout.state.root) {
			const restoreBehavior = settings.state["splits.singleRestoreBehavior"];
			const isBranch = typeof layout.state.root !== "string";

			if (isBranch || restoreBehavior === "preserve") {
				app.splits.root = layout.state.root;
				await goto("/channels/split");

				return;
			}

			if (restoreBehavior === "redirect") {
				const channel = app.channels.get(layout.state.root as string);
				settings.state.lastJoined = channel?.user.username ?? null;
			}
		}

		if (settings.state.lastJoined) {
			await goto(`/channels/${settings.state.lastJoined}`);
		}

		loading = false;
	});
</script>

{#if loading}
	<div class="flex size-full flex-col items-center justify-center">
		<Spinner class="size-6 animate-spin" />
		<span class="mt-2 text-lg font-medium">Loading</span>
	</div>
{:else}
	<Empty.Root class="h-full">
		<Empty.Header>
			<Empty.Media variant="icon">
				<ChatDots />
			</Empty.Media>

			<Empty.Title>No channel selected</Empty.Title>

			<Empty.Description>
				Select a channel from your following list or search for a channel to start chatting.
			</Empty.Description>
		</Empty.Header>

		<Empty.Content>
			<JoinDialog class={buttonVariants()}>Search channels</JoinDialog>
		</Empty.Content>
	</Empty.Root>
{/if}
