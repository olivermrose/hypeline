import { defineCommand } from "../util";

export default defineCommand({
	provider: "Twitch",
	name: "me",
	description: "Express an action in the third person",
	args: ["message"],
	// no-op since /me is the only command that Twitch allows to be sent
	async exec() {},
});
