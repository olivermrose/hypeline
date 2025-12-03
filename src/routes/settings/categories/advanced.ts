import Toolbox from "~icons/ph/toolbox";
import { settings } from "$lib/settings";
import ClearCache from "../custom/ClearCache.svelte";
import type { SettingsCategory } from "../types";
import { bind } from "./util";

export default {
	order: 9999,
	label: "Advanced",
	icon: Toolbox,
	fields: [
		{
			id: "single-connection",
			type: "switch",
			label: "Only join one channel at a time",
			description:
				"Limit the application to joining only one channel at a time to reduce resource usage. Enable this if you are experiencing performance issues.",
			binding: bind(
				() => settings.state.advanced.singleConnection,
				(v) => (settings.state.advanced.singleConnection = v),
			),
		},
		{
			type: "group",
			label: "Cache",
			fields: [
				{
					id: "clear-cache",
					type: "custom",
					label: "Clear",
					description: "Clear the application cache to free up space or resolve issues.",
					renderAs: "field",
					component: ClearCache,
				},
			],
		},
	],
} satisfies SettingsCategory;
