import { defineHandler } from "../helper";

export default defineHandler({
	name: "part",
	handle(_, channel) {
		channel.reset();
	},
});
