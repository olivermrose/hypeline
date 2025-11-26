import { SystemMessage } from "$lib/models/message/system-message";
import { defineHandler } from "../helper";

export default defineHandler({
	name: "channel.moderate",
	async handle(data, channel) {
		const message = new SystemMessage(channel);
		const moderator = await channel.viewers.fetch(data.moderator_user_id);

		switch (data.action) {
			case "emoteonly":
			case "emoteonlyoff":
			case "subscribers":
			case "subscribersoff":
			case "uniquechat":
			case "uniquechatoff": {
				const mode = data.action.startsWith("emote")
					? "emote-only"
					: data.action.startsWith("unique")
						? "unique-mode"
						: "subscriber-only";

				message.context = {
					type: "mode",
					mode,
					enabled: !data.action.includes("off"),
					seconds: Number.NaN,
					moderator,
				};

				break;
			}

			case "followers":
			case "followersoff": {
				message.context = {
					type: "mode",
					mode: "follower-only",
					enabled: !data.action.includes("off"),
					seconds: data.followers
						? data.followers.follow_duration_minutes * 60
						: Number.NaN,
					moderator,
				};

				break;
			}

			case "slow":
			case "slowoff": {
				message.context = {
					type: "mode",
					mode: "slow",
					enabled: data.slow !== null,
					seconds: data.slow?.wait_time_seconds ?? Number.NaN,
					moderator,
				};

				break;
			}

			case "clear": {
				channel.chat.deleteMessages();
				message.context = { type: "clear", moderator };

				break;
			}

			case "delete": {
				const viewer = await channel.viewers.fetch(data.delete.user_id);

				message.context = {
					type: "delete",
					text: data.delete.message_body,
					user: viewer.user,
					moderator,
				};

				break;
			}

			case "add_blocked_term":
			case "add_permitted_term":
			case "remove_blocked_term":
			case "remove_permitted_term": {
				message.context = { type: "term", data: data.automod_terms, moderator };
				break;
			}

			case "warn": {
				const viewer = await channel.viewers.fetch(data.warn.user_id);

				message.context = {
					type: "warn",
					warning: data.warn,
					viewer,
					moderator,
				};

				break;
			}

			case "timeout": {
				const viewer = await channel.viewers.fetch(data.timeout.user_id);
				channel.chat.deleteMessages(data.timeout.user_id);

				const expiration = new Date(data.timeout.expires_at);
				const duration = expiration.getTime() - message.timestamp.getTime();

				message.context = {
					type: "timeout",
					seconds: Math.ceil(duration / 1000),
					reason: data.timeout.reason,
					viewer,
					moderator,
				};

				break;
			}

			case "untimeout": {
				const viewer = await channel.viewers.fetch(data.untimeout.user_id);

				message.context = {
					type: "untimeout",
					viewer,
					moderator,
				};

				break;
			}

			case "ban":
			case "unban": {
				const isBan = data.action === "ban";
				const viewer = await channel.viewers.fetch((isBan ? data.ban : data.unban).user_id);

				if (isBan) {
					channel.chat.deleteMessages(data.ban.user_id);
				}

				message.context = {
					type: "banStatus",
					banned: isBan,
					reason: isBan ? data.ban.reason : null,
					viewer,
					moderator,
				};

				break;
			}

			case "mod":
			case "unmod": {
				const added = data.action === "mod";
				const viewer = await channel.viewers.fetch((added ? data.mod : data.unmod).user_id);

				message.context = {
					type: "roleStatus",
					role: "moderator",
					added,
					viewer,
				};

				break;
			}

			case "vip":
			case "unvip": {
				const added = data.action === "vip";
				const viewer = await channel.viewers.fetch((added ? data.vip : data.unvip).user_id);

				message.context = {
					type: "roleStatus",
					role: "VIP",
					added,
					viewer,
				};

				break;
			}

			case "raid": {
				const viewer = await channel.viewers.fetch(data.raid.user_id);

				message.context = {
					type: "raid",
					viewers: data.raid.viewer_count,
					user: viewer.user,
					moderator,
				};

				break;
			}

			case "unraid": {
				const viewer = await channel.viewers.fetch(data.unraid.user_id);

				message.context = {
					type: "unraid",
					user: viewer.user,
					moderator,
				};

				break;
			}

			default: {
				return;
			}
		}

		channel.chat.addMessage(message);
	},
});
