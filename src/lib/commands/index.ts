import { commands as builtIn } from "./built-in";
import { commands as twitch } from "./twitch";

export * from "./util";

export const commands = [...builtIn, ...twitch];
