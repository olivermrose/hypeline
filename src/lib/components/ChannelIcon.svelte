<script lang="ts" module>
	import type { Stream } from "$lib/twitch/api";
	import type { User } from "$lib/user.svelte";

	export interface ChannelIconProps {
		user: User;
		stream: Stream | null;
	}
</script>

<script lang="ts">
	import { CheckMenuItem, Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
	import { settings } from "$lib/settings";
	import { app } from "$lib/state.svelte";
	import Tooltip from "./ui/Tooltip.svelte";

	const { user, stream }: ChannelIconProps = $props();

	let menu: Menu | null = null;

	async function createMenu() {
		if (menu) return menu;

		const separator = await PredefinedMenuItem.new({
			item: "Separator",
		});

		const join = await MenuItem.new({
			id: "join",
			text: "Join",
			action() {
				settings.state.lastJoined = user.username;
			},
		});

		join.setEnabled(settings.state.lastJoined !== user.username);

		const pin = await CheckMenuItem.new({
			id: "pin",
			text: "Pin",
			action() {
				const pinned = settings.state.pinnedChannels.findIndex((c) => c.id === user.id);

				if (pinned !== -1) {
					const channel = app.channels.find((c) => c.id === user.id);
					channel?.setPinned(false);

					settings.state.pinnedChannels = settings.state.pinnedChannels.splice(pinned, 1);
				} else {
					const channel = app.channels.find((c) => c.id === user.id);
					channel?.setPinned(true);

					settings.state.pinnedChannels.push({ id: user.id, order: Date.now() });
				}
			},
		});

		pin.setChecked(settings.state.pinnedChannels.some((c) => c.id === user.id));

		const leave = await MenuItem.new({
			id: "leave",
			text: "Leave",
			action() {
				settings.state.lastJoined = null;
			},
		});

		leave.setEnabled(settings.state.lastJoined === user.username);

		menu = await Menu.new({
			items: [join, pin, separator, leave],
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
	{#snippet trigger(props)}
		<button
			{...props}
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
				draggable="false"
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
