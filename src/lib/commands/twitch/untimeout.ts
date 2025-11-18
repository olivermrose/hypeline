import { defineCommand } from "../util";
import unban from "./unban";

export default defineCommand({
	provider: "Twitch",
	name: "untimeout",
	description: "Remove a timeout on a user",
	modOnly: true,
	args: ["username"],
	exec: unban.exec,
});
