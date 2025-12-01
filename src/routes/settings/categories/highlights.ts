import Highlighter from "~icons/ph/highlighter";
import { settings } from "$lib/settings";
import Keyword from "../custom/highlights/Keyword.svelte";
import Viewer from "../custom/highlights/Viewer.svelte";
import type { SettingsCategory } from "../types";
import { bind } from "./util";

export default {
	order: 30,
	label: "Highlights",
	icon: Highlighter,
	fields: [
		{
			id: "highlights-enabled",
			type: "switch",
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
			description:
				"Switch individual highlights on or off to focus on the types of viewers you want to recognize.",
			component: Viewer,
		},
		{
			type: "custom",
			label: "Keywords",
			// TODO: temporary description, link to docs when site is up
			description:
				"Keyword highlights can use regular expressions, be matched as whole words, and be case sensitive.",
			component: Keyword,
		},
	],
} satisfies SettingsCategory;
