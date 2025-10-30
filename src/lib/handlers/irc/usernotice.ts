import { Message } from "$lib/message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "usernotice",
	handle(data, channel) {
		channel.addMessage(new Message(data));
	},
});
