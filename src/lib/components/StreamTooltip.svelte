<script lang="ts">
	import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
	import type { Snippet } from "svelte";
	import Users from "~icons/ph/users-bold";
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import type { Channel } from "$lib/models/channel.svelte";
	import { settings } from "$lib/settings";
	import GuestList from "./GuestList.svelte";
	import * as Tooltip from "./ui/tooltip";

	interface Props {
		children: Snippet;
		channel: Channel;
		collapsed: boolean;
	}

	const { children, channel, collapsed }: Props = $props();

	async function createMenu() {
		const separator = await PredefinedMenuItem.new({
			item: "Separator",
		});

		const joinItem = await MenuItem.new({
			id: "join",
			text: "Join",
			async action() {
				await goto(`/channels/${channel.user.username}`);
			},
		});

		joinItem.setEnabled(settings.state.lastJoined !== channel.user.username);

		const leaveItem = await MenuItem.new({
			id: "leave",
			text: "Leave",
			async action() {
				await app.joined?.leave();
				await goto("/");
			},
		});

		leaveItem.setEnabled(settings.state.lastJoined === channel.user.username);

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

<Tooltip.Root>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			<div
				{...props}
				class="hover:bg-accent relative flex items-center gap-2 rounded-lg p-1.5 transition-colors"
				oncontextmenu={openContextMenu}
			>
				<a
					class="absolute inset-0 z-10"
					href="/channels/{channel.user.username}"
					data-sveltekit-preload-data="off"
					aria-label="Join {channel.user.displayName}"
				>
				</a>

				<img
					class={["size-8 rounded-full object-cover", !channel.stream && "grayscale"]}
					src={channel.user.avatarUrl}
					alt={channel.user.displayName}
					width="150"
					height="150"
				/>

				{@render children()}
			</div>
		{/snippet}
	</Tooltip.Trigger>

	<Tooltip.Content
		class={["max-w-64", !collapsed && !channel.stream && "hidden"]}
		side="right"
		sideOffset={8}
	>
		{#if channel.stream}
			<div class="space-y-0.5">
				{#if collapsed}
					<div
						class="dark:text-twitch text-twitch-link overflow-hidden overflow-ellipsis whitespace-nowrap"
					>
						{channel.user.displayName} &bullet; {channel.stream.game}
					</div>
				{/if}

				<p class="line-clamp-2">{channel.stream.title}</p>

				{#if collapsed}
					<div class="flex items-center text-red-400 dark:text-red-500">
						<Users class="mr-1 size-3" />

						<p class="text-xs">
							{channel.stream.viewers} viewers
						</p>
					</div>
				{/if}

				{#if channel.stream.guests.size}
					<GuestList {channel} tooltip />
				{/if}
			</div>
		{:else if collapsed}
			{channel.user.displayName}
		{/if}
	</Tooltip.Content>
</Tooltip.Root>
