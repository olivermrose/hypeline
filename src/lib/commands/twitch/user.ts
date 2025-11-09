import { defineCommand } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "user",
	description: "Display profile information about a user on the channel",
	args: ["username"],
	async exec(args, channel, user) {},
});
