import type { Channel } from "$lib/channel.svelte";
import { CommandError, ErrorMessage } from "$lib/errors";
import { app } from "$lib/state.svelte";
import type { User } from "$lib/user.svelte";
import { Viewer } from "$lib/viewer.svelte";

export interface Command {
	name: string;
	description: string;
	args?: string[];
	broadcasterOnly?: boolean;
	modOnly?: boolean;
	exec: (args: string[], channel: Channel, user: User) => Promise<void>;
}

export function defineCommand<const T extends Command>(command: T) {
	return command;
}

export async function getTarget(username: string, channel: Channel) {
	if (!username) {
		throw new CommandError(ErrorMessage.MISSING_ARG("username"));
	}

	username = username.toLowerCase();

	let target = channel.viewers.values().find((v) => v.username === username);

	if (!target) {
		const user = await app.twitch.users.fetch(username, "login");

		target = new Viewer(channel, user);
		channel.viewers.set(target.id, target);
	}

	return target;
}

export function parseBool(arg: string | undefined): boolean | null {
	if (!arg) return true;

	arg = arg.toLowerCase();

	const truthy = arg === "true" || arg === "on";
	const falsy = arg === "false" || arg === "off";

	return truthy ? true : falsy ? false : null;
}

const unitMap: Record<string, number> = {
	s: 1,
	m: 60,
	h: 60 * 60,
	d: 60 * 60 * 24,
	w: 60 * 60 * 24 * 7,
	mo: 60 * 60 * 24 * 30,
};

export function parseDuration(arg: string | undefined): number | null {
	const match = arg ? /^(\d+(?:\.\d+)?)([shdw]|mo?)?$/i.exec(arg) : null;
	if (!match) return null;

	const value = Number(match[1]);
	const unit = match[2].toLowerCase() ?? "s";

	return value * unitMap[unit];
}
