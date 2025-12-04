import Monitor from "~icons/ph/monitor";
import { settings } from "$lib/settings";
import Theme from "../custom/Theme.svelte";
import type { SettingsCategory } from "../types";

export default {
	order: 10,
	label: "Appearance",
	icon: Monitor,
	fields: [
		{
			id: "appearance.theme",
			type: "custom",
			label: "Theme",
			component: Theme,
		},
		{
			type: "group",
			label: "Timestamps",
			fields: [
				{
					id: "appearance.timestamps.show",
					type: "switch",
					label: "Show timestamps next to messages",
				},
				{
					id: "appearance.timestamps.format",
					type: "radio",
					label: "Format",
					items: [
						{ label: "Auto", value: "auto" },
						{ label: "12-hour", value: "12" },
						{ label: "24-hour", value: "24" },
						{ label: "Custom", value: "custom" },
					],
					disabled: () => !settings.state["appearance.timestamps.show"],
				},
				{
					id: "appearance.timestamps.customFormat",
					type: "input",
					label: "Custom format",
					description:
						'Formats use the same <a href="https://day.js.org/docs/en/display/format" target="_blank">tokens</a> as <a href="https://day.js.org/en" target="_blank">Day.js</a>. Localized formats are not enabled.',
					placeholder: "e.g. HH:mm:ss",
					disabled: () => settings.state["appearance.timestamps.format"] !== "custom",
				},
			],
		},
	],
} satisfies SettingsCategory;
