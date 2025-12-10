import { CheckMenuItem, Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { app } from "$lib/app.svelte";
import type { Channel } from "$lib/models/channel.svelte";
import { settings } from "$lib/settings";
import type { SplitBranch } from "$lib/split-layout";

type SplitDirection = "up" | "down" | "left" | "right";

async function splitItem(channel: Channel, direction: SplitDirection) {
	return MenuItem.new({
		id: `split-${direction}`,
		text: `Split ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
		enabled: !settings.state["advanced.singleConnection"],
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

			if (page.route.id !== "/(main)/channels/split") {
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
