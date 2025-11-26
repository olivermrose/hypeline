import { UserMessage } from "$lib/models/message/user-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "usernotice",
	handle(data, channel) {
		const message = new UserMessage(channel, data);

		if (message.event?.type === "raid" && channel.stream?.viewersCount) {
			channel.stream.viewersCount += message.event.viewer_count;
		}

		channel.chat.addMessage(message);
	},
});
