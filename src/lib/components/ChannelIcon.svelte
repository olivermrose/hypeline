<script lang="ts">
	import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import type { Stream } from "$lib/graphql";
	import { settings } from "$lib/settings";
	import type { User } from "$lib/user.svelte";
	import Tooltip from "./ui/Tooltip.svelte";

	interface Props {
		user: User;
		stream: Stream | null;
	}

	const { user, stream }: Props = $props();

	async function createMenu() {
		const separator = await PredefinedMenuItem.new({
			item: "Separator",
		});

		const joinItem = await MenuItem.new({
			id: "join",
			text: "Join",
			async action() {
				await goto(`/channels/${user.username}`);
			},
		});

		joinItem.setEnabled(settings.state.lastJoined !== user.username);

		const leaveItem = await MenuItem.new({
			id: "leave",
			text: "Leave",
			async action() {
				await app.joined?.leave();
				await goto("/");
			},
		});

		leaveItem.setEnabled(settings.state.lastJoined === user.username);

		return Menu.new({
			items: [joinItem, separator, leaveItem],
		});
	}

	async function openContextMenu(event: MouseEvent) {
		event.preventDefault();

		const menu = await createMenu();
		await menu.popup();
	}
</script>

<Tooltip class="max-w-64" side="right" sideOffset={18}>
	{#snippet trigger()}
		<a
			class="bg-muted flex size-10 items-center justify-center overflow-hidden rounded-full border"
			type="button"
			href="/channels/{user.username}"
			oncontextmenu={openContextMenu}
			data-sveltekit-preload-data="off"
		>
			<img
				class={["object-cover", !stream && "grayscale"]}
				src={user.avatarUrl}
				alt={user.displayName}
				width="300"
				height="300"
			/>
		</a>
	{/snippet}

	{#if stream}
		<div class="space-y-0.5">
			<div class="text-twitch-link overflow-hidden overflow-ellipsis whitespace-nowrap">
				{user.displayName} &bullet; {stream.game?.displayName}
			</div>

			<p class="line-clamp-2">{stream.title}</p>

			<div class="text-muted-foreground flex items-center">
				<span class="lucide--users iconify mr-1 size-3"></span>

				<p class="text-xs">
					{stream.viewersCount} viewers
				</p>
			</div>
		</div>
	{:else}
		{user.displayName}
	{/if}
</Tooltip>
