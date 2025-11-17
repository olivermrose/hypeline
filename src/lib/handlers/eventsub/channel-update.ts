import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.chat.update",
	handle(data, channel) {
		if (channel.stream) {
			channel.stream.title = data.title;
		}
	},
});
