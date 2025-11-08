import { UserMessage } from "$lib/models";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "usernotice",
	handle(data, channel) {
		channel.addMessage(new UserMessage(channel, data));
	},
});
