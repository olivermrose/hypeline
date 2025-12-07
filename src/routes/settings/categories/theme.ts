import Monitor from "~icons/ph/monitor";
import Custom from "../custom/theme/Custom.svelte";
import Default from "../custom/theme/Default.svelte";
import type { SettingsCategory } from "../types";

export default {
	order: 10,
	label: "Theme",
	icon: Monitor,
	fields: [
		{
			id: "theme.default",
			type: "custom",
			label: "Default",
			component: Default,
		},
		{
			id: "theme.custom",
			type: "custom",
			label: "Custom",
			description:
				"Completely customize the appearance of the application with CSS. Make your own or download themes created by the community.",
			component: Custom,
		},
	],
} satisfies SettingsCategory;
