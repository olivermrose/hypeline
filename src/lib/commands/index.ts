import type { Channel } from "$lib/models/channel.svelte";
import type { User } from "$lib/models/user.svelte";

export type CommandProvider = "Built-in" | "Twitch";

export interface Command {
	provider: CommandProvider;
	name: string;
	description: string;
	args?: string[];
	broadcasterOnly?: boolean;
	modOnly?: boolean;
	exec: (args: string[], channel: Channel, user: User) => Promise<void>;
}

const imports = import.meta.glob(["./built-in/*.ts", "./twitch/*.ts"], {
	eager: true,
	import: "default",
});

export const commands = Object.values(imports) as Command[];
