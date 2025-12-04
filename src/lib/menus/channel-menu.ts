import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { goto } from "$app/navigation";
import { app } from "$lib/app.svelte";
import type { Channel } from "$lib/models/channel.svelte";

export async function createChannelMenu(channel: Channel) {
	const separator = await PredefinedMenuItem.new({
		item: "Separator",
	});

	const join = await MenuItem.new({
		id: "join",
		text: "Join",
		enabled: !channel.joined,
		async action() {
			await goto(`/channels/${channel.user.username}`);
		},
	});

	const leave = await MenuItem.new({
		id: "leave",
		text: "Leave",
		enabled: channel.joined,
		async action() {
			await channel.leave();

			if (app.focused === channel) {
				await goto("/");
			}
		},
	});

	return Menu.new({
		items: [join, separator, leave],
	});
}
