import Toolbox from "~icons/ph/toolbox";
import ClearCache from "../custom/ClearCache.svelte";
import type { SettingsCategory } from "../types";

export default {
	order: 9999,
	label: "Advanced",
	icon: Toolbox,
	fields: [
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
