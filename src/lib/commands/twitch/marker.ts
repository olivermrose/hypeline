import dayjs from "dayjs";
import { CommandError, ErrorMessage } from "$lib/errors";
import { SystemMessage } from "$lib/models";
import { defineCommand } from "../";

export default defineCommand({
	provider: "Twitch",
	name: "marker",
	description: "Add a stream marker at the current timestamp",
	modOnly: true,
	args: ["description"],
	async exec(args, channel) {
		const description = args.join(" ");

		if (!channel.stream) {
			throw new CommandError(ErrorMessage.CHANNEL_MUST_BE_LIVE);
		}

		if (description.length > 140) {
			throw new CommandError(ErrorMessage.MARKER_DESC_TOO_LONG);
		}

		const marker = await channel.createMarker(description);

		const duration = dayjs.duration(marker.position_seconds, "s");
		const format = duration.asHours() > 0 ? "H[h] mm[m] ss[s]" : "mm[m] ss[s]";

		const echo = description ? `: ${description}` : "";
		const message = new SystemMessage(
			`Stream marker created at ${duration.format(format) + echo}`,
		);

		channel.addMessage(message);
	},
});
