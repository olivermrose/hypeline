import Chat from "~icons/ph/chat";
import { settings } from "$lib/settings";
import type { SettingsCategory } from "../types";
import { bind } from "./util";

export default {
	order: 20,
	label: "Chat",
	icon: Chat,
	fields: [
		{
			type: "group",
			fields: [
				{
					id: "hide-scrollbar",
					type: "switch",
					label: "Hide scrollbar",
					description: "Toggle the visibility of the scrollbar.",
					binding: bind(
						() => !settings.state.chat.scrollbar,
						(v) => (settings.state.chat.scrollbar = !v),
					),
				},
				{
					id: "new-separator",
					type: "switch",
					label: "New message separator",
					description: "Show a separator for new messages when the window loses focus.",
					binding: bind(
						() => settings.state.chat.newSeparator,
						(v) => (settings.state.chat.newSeparator = v),
					),
				},
				{
					id: "embeds",
					type: "switch",
					label: "Enable embeds",
					description: "Show embedded content for supported links.",
					binding: bind(
						() => settings.state.chat.embeds,
						(v) => (settings.state.chat.embeds = v),
					),
				},
			],
		},
		{
			type: "group",
			label: "Usernames",
			fields: [
				{
					id: "localized-names",
					type: "switch",
					label: "Display localized names",
					description:
						"Show the user's localized display name if they have their Twitch language set to Arabic, Chinese, Japanese, or Korean.",
					binding: bind(
						() => settings.state.chat.usernames.localized,
						(v) => (settings.state.chat.usernames.localized = v),
					),
				},
				{
					id: "readable-colors",
					type: "switch",
					label: "Readable name colors",
					description:
						"Lightens or darkens the color of usernames based on the current theme. This does not apply to 7TV paints.",
					binding: bind(
						() => settings.state.chat.usernames.readable,
						(v) => (settings.state.chat.usernames.readable = v),
					),
				},
				{
					id: "paint-usernames",
					type: "switch",
					label: "Paint usernames",
					description: "Style usernames with 7TV paints if the user has one.",
					binding: bind(
						() => settings.state.chat.usernames.paint,
						(v) => (settings.state.chat.usernames.paint = v),
					),
				},
				{
					id: "mention-style",
					type: "radio",
					label: "Mention style",
					description:
						"Choose how mentions in messages are displayed. Painted mentions will fallback to the user's color if they have no 7TV paint.",
					options: [
						{ label: "None", value: "none" },
						{ label: "Colored", value: "colored" },
						{ label: "Painted", value: "painted" },
					],
					binding: bind(
						() => settings.state.chat.usernames.mentionStyle,
						(v) => (settings.state.chat.usernames.mentionStyle = v),
					),
				},
			],
		},
		{
			type: "group",
			label: "Emotes",
			fields: [
				{
					id: "emotes-ffz",
					type: "switch",
					label: "Enable FrankerFaceZ emotes",
					description:
						'Show and autocomplete emotes from <a href="https://www.frankerfacez.com/" target="_blank">FrankerFaceZ</a>.',
					binding: bind(
						() => settings.state.chat.emotes.ffz,
						(v) => (settings.state.chat.emotes.ffz = v),
					),
				},
				{
					id: "emotes-bttv",
					type: "switch",
					label: "Enable BetterTTV emotes",
					description:
						'Show and autocomplete emotes from <a href="https://betterttv.com/" target="_blank">BetterTTV</a>.',
					binding: bind(
						() => settings.state.chat.emotes.bttv,
						(v) => (settings.state.chat.emotes.bttv = v),
					),
				},
				{
					id: "emotes-7tv",
					type: "switch",
					label: "Enable 7TV emotes",
					description:
						'Show and autocomplete emotes from <a href="https://7tv.app/" target="_blank">7TV</a>.',
					binding: bind(
						() => settings.state.chat.emotes.seventv,
						(v) => (settings.state.chat.emotes.seventv = v),
					),
				},
				{
					id: "emotes-padding",
					type: "slider",
					label: "Padding",
					description: "Adjust the spacing around emotes in chat.",
					thumbLabel: "{value}px",
					min: 0,
					max: 10,
					step: 1,
					binding: bind(
						() => settings.state.chat.emotes.padding,
						(v) => (settings.state.chat.emotes.padding = v),
					),
				},
			],
		},
		{
			type: "group",
			label: "Messages",
			fields: [
				{
					id: "duplicate-bypass",
					type: "switch",
					label: "Bypass duplicate message warning",
					description:
						"Allows you to send identical messages even if you're not a moderator or a VIP.",
					binding: bind(
						() => settings.state.chat.messages.duplicateBypass,
						(v) => (settings.state.chat.messages.duplicateBypass = v),
					),
				},
				{
					type: "group",
					label: "History",
					fields: [
						{
							id: "history-enabled",
							type: "switch",
							label: "Fetch recent messages upon joining a channel",
							description:
								'This feature uses a <a href="https://recent-messages.robotty.de/" target="_blank">third-party API</a> that temporarily stores the messages sent in joined channels. To opt-out, disable this setting.',
							binding: bind(
								() => settings.state.chat.messages.history.enabled,
								(v) => (settings.state.chat.messages.history.enabled = v),
							),
						},
						{
							id: "history-limit",
							type: "slider",
							label: "Limit",
							description:
								"Change how many previous messages to load when joining a channel.",
							min: 0,
							max: 800,
							step: 50,
							disabled: () => !settings.state.chat.messages.history.enabled,
							binding: bind(
								() => settings.state.chat.messages.history.limit,
								(v) => (settings.state.chat.messages.history.limit = v),
							),
						},
						{
							id: "history-separator",
							type: "switch",
							label: "Separate recent messages",
							description: "Show a separator between recent and live messages.",
							binding: bind(
								() => settings.state.chat.messages.history.separator,
								(v) => (settings.state.chat.messages.history.separator = v),
							),
						},
					],
				},
			],
		},
	],
} satisfies SettingsCategory;
