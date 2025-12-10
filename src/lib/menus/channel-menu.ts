import { CheckMenuItem, Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { goto } from "$app/navigation";
import { app } from "$lib/app.svelte";
import type { Channel } from "$lib/models/channel.svelte";
import { settings } from "$lib/settings";
import type { SplitBranch, SplitDirection } from "$lib/split-layout";

async function splitItem(channel: Channel, direction: SplitDirection) {
	const enabled =
		app.focused !== null &&
		app.focused.id !== channel.id &&
		!app.splits.contains(app.splits.root!, channel.id);

	return MenuItem.new({
		id: `split-${direction}`,
		text: `Split ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
		enabled,
		async action() {
			await channel.join(true);

			if (!app.focused) return;

			app.splits.root ??= app.focused.id;

			const node: SplitBranch = {
				axis: direction === "up" || direction === "down" ? "vertical" : "horizontal",
				before: channel.id,
				after: app.focused.id,
			};

			if (direction === "down" || direction === "right") {
				node.before = app.focused.id;
				node.after = channel.id;
			}

			app.splits.insert(app.focused.id, channel.id, node);

			if (!app.splits.active) {
				await goto("/channels/split");
			}
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

			if (app.focused === channel) {
				await goto("/");
			}
		},
	});

	const openInSplit = await MenuItem.new({
		id: "open-in-split",
		text: "Open in Split View",
		enabled: !settings.state["advanced.singleConnection"] && !app.splits.active,
		async action() {
			app.splits.root = channel.id;
			await goto("/channels/split");
		},
	});

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
		async action() {
			await channel.leave();
			app.channels.delete(channel.id);
			await goto("/");
		},
	});

	const items = [join, leave, pin, separator, openInSplit];

	if (app.splits.active && !settings.state["advanced.singleConnection"]) {
		const splitItems = await Promise.all([
			splitItem(channel, "up"),
			splitItem(channel, "down"),
			splitItem(channel, "left"),
			splitItem(channel, "right"),
		]);

		items.push(separator, ...splitItems);
	}

	if (channel.ephemeral) {
		items.push(separator, remove);
	}

	return Menu.new({ items });
}
