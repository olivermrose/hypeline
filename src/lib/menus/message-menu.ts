import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { app } from "$lib/app.svelte";
import type { UserMessage } from "$lib/models/message/user-message";

export async function createMessageMenu(message: UserMessage) {
	const items: (MenuItem | PredefinedMenuItem)[] = [];

	const separator = await PredefinedMenuItem.new({
		item: "Separator",
	});

	const copy = await PredefinedMenuItem.new({ item: "Copy" });

	const reply = await MenuItem.new({
		id: "reply",
		text: "Reply",
		action() {
			message.channel.chat.replyTarget = message;
		},
	});

	items.push(copy, separator, reply);

	if (app.user?.moderating.has(message.channel.id)) {
		const deleteMsg = await MenuItem.new({
			id: "delete",
			text: "Delete",
			enabled: message.actionable,
			action: () => message.delete(),
		});

		const timeout = await MenuItem.new({
			id: "timeout",
			text: "Timeout (10 minutes)",
			enabled: message.actionable,
			action: () => message.viewer?.timeout({ duration: 600 }),
		});

		const ban = await MenuItem.new({
			id: "ban",
			text: "Ban",
			enabled: message.actionable,
			action: () => message.viewer?.ban(),
		});

		items.push(separator, deleteMsg, timeout, ban);
	}

	return Menu.new({ items });
}
