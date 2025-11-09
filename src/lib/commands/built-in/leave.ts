import { goto } from "$app/navigation";
import { defineCommand } from "../";

export default defineCommand({
	provider: "Built-in",
	name: "leave",
	description: "Leave the current channel",
	async exec(_, channel) {
		await channel.leave();
		await goto("/");
	},
});
