import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.update",
	handle(data, channel) {
		if (channel.stream) {
			channel.stream.title = data.title;
		}
	},
});
