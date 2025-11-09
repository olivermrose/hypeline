import { defineCommand } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "shared-chat",
	description: "Start a new shared chat session or join one in an existing collaboration",
	broadcasterOnly: true,
	async exec(args, channel, user) {},
});
