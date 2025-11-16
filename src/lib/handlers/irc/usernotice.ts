import { UserMessage } from "$lib/models";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "usernotice",
	handle(data, channel) {
		const message = new UserMessage(channel, data);

		if (message.event?.type === "raid" && channel.stream?.viewersCount) {
			channel.stream.viewersCount += message.event.viewer_count;
		}

		channel.addMessage(message);
	},
});
