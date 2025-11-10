import Custom from "$lib/components/settings/highlights/Custom.svelte";
import Viewers from "$lib/components/settings/highlights/Viewers.svelte";
import Theme from "$lib/components/settings/Theme.svelte";
import { settings } from "./store";
import type { SettingsCategory } from "./schema";

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
						get model() {
							return settings.state.appearance.timestamps.show;
						},
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
						get disabled() {
							return !settings.state.appearance.timestamps.show;
						},
						get model() {
							return settings.state.appearance.timestamps.format;
						},
					},
					{
						id: "timestamp-format-custom",
						type: "input",
						label: "Custom Format",
						description:
							'Formats use the format tokens used by <a class="text-twitch-link" href="https://day.js.org/en">Day.js</a>; view the full list of tokens and their descriptions <a class="text-twitch-link" href="https://day.js.org/docs/en/display/format">here</a> (note that localized formats are not enabled).',
						get disabled() {
							return settings.state.appearance.timestamps.format !== "custom";
						},
						get model() {
							return settings.state.appearance.timestamps.customFormat;
						},
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
						get model() {
							return settings.state.chat.localizedNames;
						},
					},
					{
						id: "readable-colors",
						type: "toggle",
						label: "Readable name colors",
						description:
							"Lightens or darkens the color of usernames based on the current theme. This does not apply to 7TV paints.",
						get model() {
							return settings.state.chat.readableColors;
						},
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
						get model() {
							return settings.state.chat.mentionStyle;
						},
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
						get model() {
							return settings.state.chat.emotes.ffz;
						},
					},
					{
						id: "emotes-bttv",
						type: "toggle",
						label: "Enable BTTV emotes",
						description:
							'Show and autocomplete emotes from <a class="text-twitch-link" href="https://betterttv.com/">BetterTTV</a>',
						get model() {
							return settings.state.chat.emotes.bttv;
						},
					},
					{
						id: "emotes-7tv",
						type: "toggle",
						label: "Enable 7TV emotes",
						description:
							'Show and autocomplete emotes from <a class="text-twitch-link" href="https://7tv.app/">7TV</a>',
						get model() {
							return settings.state.chat.emotes.seventv;
						},
					},
				],
			},
			{
				type: "group",
				label: "Messages",
				items: [
					{
						id: "bypass-duplicate",
						type: "toggle",
						label: "Bypass duplicate message warning",
						description:
							"Allows you to send identical messages even if you're not a moderator or a VIP.",
						get model() {
							return settings.state.chat.bypassDuplicate;
						},
					},
					{
						type: "group",
						label: "Message History",
						items: [
							{
								id: "message-history-enabled",
								type: "toggle",
								label: "Fetch recent messages upon joining a channel",
								description:
									'This feature uses a <a class="text-twitch-link" href="https://recent-messages.robotty.de/">third-party API</a> that temporarily stores the messages sent in joined channels. To opt-out, disable this setting.',
								get model() {
									return settings.state.chat.history.enabled;
								},
							},
							{
								id: "message-history-limit",
								type: "slider",
								label: "Limit",
								description:
									"Change how many previous messages to load when joining a channel.",
								min: 0,
								max: 800,
								step: 50,
								get disabled() {
									return !settings.state.chat.history.enabled;
								},
								get model() {
									return settings.state.chat.history.limit;
								},
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
				get model() {
					return settings.state.highlights.enabled;
				},
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
