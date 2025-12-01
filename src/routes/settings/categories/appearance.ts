import Monitor from "~icons/ph/monitor";
import { settings } from "$lib/settings";
import Theme from "../custom/Theme.svelte";
import type { SettingsCategory } from "../types";
import { bind } from "./util";

export default {
	order: 10,
	label: "Appearance",
	icon: Monitor,
	fields: [
		{
			type: "custom",
			label: "Theme",
			component: Theme,
		},
		{
			type: "group",
			label: "Timestamps",
			fields: [
				{
					id: "show-timestamps",
					type: "switch",
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
					label: "Custom format",
					description:
						'Formats use the same <a href="https://day.js.org/docs/en/display/format" target="_blank">tokens</a> as <a href="https://day.js.org/en" target="_blank">Day.js</a>. Localized formats are not enabled.',
					placeholder: "e.g. HH:mm:ss",
					disabled: () => settings.state.appearance.timestamps.format !== "custom",
					binding: bind(
						() => settings.state.appearance.timestamps.customFormat,
						(v) => (settings.state.appearance.timestamps.customFormat = v),
					),
				},
			],
		},
	],
} satisfies SettingsCategory;
