<script lang="ts">
	import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
	import { settings } from "$lib/settings";
	import type { Stream } from "$lib/twitch/api";
	import type { User } from "$lib/user.svelte";
	import Tooltip from "./ui/Tooltip.svelte";

	interface Props {
		user: User;
		stream: Stream | null;
	}

	const { user, stream }: Props = $props();

	let menu: Menu | null = null;

	async function createMenu() {
		if (menu) return menu;

		const separator = await PredefinedMenuItem.new({
			item: "Separator",
		});

		const joinItem = await MenuItem.new({
			id: "join",
			text: "Join",
			action() {
				settings.state.lastJoined = user.username;
			},
		});

		joinItem.setEnabled(settings.state.lastJoined !== user.username);

		const leaveItem = await MenuItem.new({
			id: "leave",
			text: "Leave",
			action() {
				settings.state.lastJoined = null;
			},
		});

		leaveItem.setEnabled(settings.state.lastJoined === user.username);

		menu = await Menu.new({
			items: [joinItem, separator, leaveItem],
		});

		return menu;
	}

	async function openContextMenu(event: MouseEvent) {
		event.preventDefault();

		const menu = await createMenu();
		await menu.popup();
	}
</script>

<Tooltip class="max-w-64" side="right" sideOffset={18}>
	{#snippet trigger()}
		<button
			class="bg-muted flex size-10 items-center justify-center overflow-hidden rounded-full border"
			type="button"
			onclick={() => {
				settings.state.lastJoined = user.username;
			}}
			oncontextmenu={openContextMenu}
		>
			<img
				class={["object-cover", !stream && "grayscale"]}
				src={user.avatarUrl}
				alt={user.displayName}
				width="300"
				height="300"
			/>
		</button>
	{/snippet}

	{#if stream}
		<div class="space-y-0.5">
			<div class="text-twitch-link overflow-hidden overflow-ellipsis whitespace-nowrap">
				{user.displayName} &bullet; {stream.game_name}
			</div>

			<p class="line-clamp-2">{stream.title}</p>

			<div class="text-muted-foreground flex items-center">
				<span class="lucide--users iconify mr-1 size-3"></span>

				<p class="text-xs">
					{stream.viewer_count} viewers
				</p>
			</div>
		</div>
	{:else}
		{user.displayName}
	{/if}
</Tooltip>
