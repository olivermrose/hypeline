import Toolbox from "~icons/ph/toolbox";
import ClearCache from "../custom/ClearCache.svelte";
import type { SettingsCategory } from "../types";

export default {
	order: 9999,
	label: "Advanced",
	icon: Toolbox,
	fields: [
		{
			id: "advanced.singleConnection",
			type: "switch",
			label: "Only join one channel at a time",
			description:
				"Limit the application to joining only one channel at a time to reduce resource usage. Enable this if you are experiencing performance issues.",
		},
		{
			type: "group",
			label: "Cache",
			fields: [
				{
					id: "cache.clear",
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
