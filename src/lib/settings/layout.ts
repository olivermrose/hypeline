import Custom from "$lib/components/settings/highlights/Custom.svelte";
import Viewers from "$lib/components/settings/highlights/Viewers.svelte";
import Theme from "$lib/components/settings/Theme.svelte";
import { settings } from "./store";
import type { Binding, SettingsCategory } from "./schema";

function bind<T>(get: () => T, set: (value: T) => void): Binding<T> {
	return { get, set };
}

export const layout: SettingsCategory[] = [
	{
		label: "Appearance",
		icon: "lucide--monitor-cog",
		settings: [
			{
				type: "custom",
				label: "Theme",
				component: Theme,
			},
			{
				type: "group",
				label: "Timestamps",
				items: [
					{
						id: "show-timestamps",
						type: "toggle",
						label: "Show timestamps next to messages",
						binding: bind(
							() => settings.state.appearance.timestamps.show,
							(v) => (settings.state.appearance.timestamps.show = v),
						),
					},
					{
						id: "timestamp-format",
						type: "radio",
						label: "Format",
						options: [
							{ label: "Auto", value: "auto" },
							{ label: "12-hour", value: "12" },
							{ label: "24-hour", value: "24" },
							{ label: "Custom", value: "custom" },
						],
						disabled: () => !settings.state.appearance.timestamps.show,
						binding: bind(
							() => settings.state.appearance.timestamps.format,
							(v) => (settings.state.appearance.timestamps.format = v),
						),
					},
					{
						id: "timestamp-format-custom",
						type: "input",
						label: "Custom Format",
						description:
							'Formats use the format tokens used by <a class="text-twitch-link" href="https://day.js.org/en">Day.js</a>; view the full list of tokens and their descriptions <a class="text-twitch-link" href="https://day.js.org/docs/en/display/format">here</a> (note that localized formats are not enabled).',
						disabled: () => settings.state.appearance.timestamps.format !== "custom",
						binding: bind(
							() => settings.state.appearance.timestamps.customFormat,
							(v) => (settings.state.appearance.timestamps.customFormat = v),
						),
					},
				],
			},
		],
	},
	{
		label: "Chat",
		icon: "lucide--message-square",
		settings: [
			{
				type: "group",
				label: "Usernames",
				items: [
					{
						id: "localized-names",
						type: "toggle",
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
						type: "toggle",
						label: "Readable name colors",
						description:
							"Lightens or darkens the color of usernames based on the current theme. This does not apply to 7TV paints.",
						binding: bind(
							() => settings.state.chat.usernames.readable,
							(v) => (settings.state.chat.usernames.readable = v),
						),
					},
					{
						id: "mention-style",
						type: "radio",
						label: "Mention Style",
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
				items: [
					{
						id: "emotes-ffz",
						type: "toggle",
						label: "Enable FFZ emotes",
						description:
							'Show and autocomplete emotes from <a class="text-twitch-link" href="https://www.frankerfacez.com/">FrankerFaceZ</a>',
						binding: bind(
							() => settings.state.chat.emotes.ffz,
							(v) => (settings.state.chat.emotes.ffz = v),
						),
					},
					{
						id: "emotes-bttv",
						type: "toggle",
						label: "Enable BTTV emotes",
						description:
							'Show and autocomplete emotes from <a class="text-twitch-link" href="https://betterttv.com/">BetterTTV</a>',
						binding: bind(
							() => settings.state.chat.emotes.bttv,
							(v) => (settings.state.chat.emotes.bttv = v),
						),
					},
					{
						id: "emotes-7tv",
						type: "toggle",
						label: "Enable 7TV emotes",
						description:
							'Show and autocomplete emotes from <a class="text-twitch-link" href="https://7tv.app/">7TV</a>',
						binding: bind(
							() => settings.state.chat.emotes.seventv,
							(v) => (settings.state.chat.emotes.seventv = v),
						),
					},
				],
			},
			{
				type: "group",
				label: "Messages",
				items: [
					{
						id: "duplicate-bypass",
						type: "toggle",
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
						items: [
							{
								id: "history-enabled",
								type: "toggle",
								label: "Fetch recent messages upon joining a channel",
								description:
									'This feature uses a <a class="text-twitch-link" href="https://recent-messages.robotty.de/">third-party API</a> that temporarily stores the messages sent in joined channels. To opt-out, disable this setting.',
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
						],
					},
				],
			},
		],
	},
	{
		label: "Highlights",
		icon: "lucide--highlighter",
		settings: [
			{
				id: "highlights-enabled",
				type: "toggle",
				label: "Highlight messages",
				description:
					"Message highlights allow you to easily identify different types of viewers or when specific keywords are sent in chat.",
				binding: bind(
					() => settings.state.highlights.enabled,
					(v) => (settings.state.highlights.enabled = v),
				),
			},
			{
				type: "custom",
				label: "Viewers",
				component: Viewers,
			},
			{
				type: "custom",
				label: "Custom",
				component: Custom,
			},
		],
	},
];
