import { CheckMenuItem, Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { goto } from "$app/navigation";
import { app } from "$lib/app.svelte";
import type { SplitDirection, SplitParent } from "$lib/managers/split-manager.svelte";
import type { Channel } from "$lib/models/channel.svelte";
import { settings } from "$lib/settings";

// function findSplit(splits: Split[], id: string): Split | undefined {
// 	for (const split of splits) {
// 		if (split.id === id) return split;
// 		const found = findSplit(split.splits, id);
// 		if (found) return found;
// 	}
// }

// function removeSplit(splits: Split[], id: string): Split[] {
// 	return splits
// 		.filter((s) => s.id !== id)
// 		.map((s) => ({ ...s, splits: removeSplit(s.splits, id) }));
// }

async function splitItem(channel: Channel, direction: SplitDirection) {
	return MenuItem.new({
		id: `split-${direction}`,
		text: `Split ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
		enabled: !settings.state["advanced.singleConnection"],
		async action() {
			if (!channel.joined) {
				await channel.join(true);
			}

			if (!app.focused) return;

			const node: SplitParent = {
				direction: direction === "up" || direction === "down" ? "vertical" : "horizontal",
				first: channel.id,
				second: app.focused.id,
			};

			if (direction === "down" || direction === "right") {
				node.first = app.focused.id;
				node.second = channel.id;
			}

			app.splits.insert(app.focused.id, channel.id, node);
			// // If we are splitting a channel that is already in a split, add to its splits
			// if (app.focused && app.focused.id !== channel.id) {
			// 	const parent = findSplit(settings.state.splits, app.focused.id);

			// 	if (parent) {
			// 		parent.splits.push(split);
			// 		settings.state.splits = [...settings.state.splits];

			// 		return;
			// 	}
			// }

			// // Otherwise split the main view
			// settings.state.splits.push(split);
		},
	});
}

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

			// settings.state.splits = removeSplit(settings.state.splits, channel.id);

			if (app.focused === channel) {
				await goto("/");
			}
		},
	});

	const splitUp = await splitItem(channel, "up");
	const splitDown = await splitItem(channel, "down");
	const splitLeft = await splitItem(channel, "left");
	const splitRight = await splitItem(channel, "right");

	const pin = await CheckMenuItem.new({
		id: "pin",
		text: "Pin",
		accelerator: "CmdOrCtrl+P",
		enabled: !channel.ephemeral,
		checked: channel.pinned,
		async action() {
			if (channel.pinned) {
				settings.state.pinned = settings.state.pinned.filter((id) => id !== channel.id);
			} else {
				settings.state.pinned.push(channel.id);
			}
		},
	});

	const remove = await MenuItem.new({
		id: "remove",
		text: "Remove",
		enabled: channel.ephemeral,
		async action() {
			await channel.leave();
			// settings.state.splits = removeSplit(settings.state.splits, channel.id);
			app.channels.delete(channel.id);
			await goto("/");
		},
	});

	return Menu.new({
		items: [
			join,
			leave,
			pin,
			separator,
			splitUp,
			splitDown,
			splitLeft,
			splitRight,
			separator,
			remove,
		],
	});
}
