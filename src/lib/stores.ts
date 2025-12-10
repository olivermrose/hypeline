import { RuneStore } from "@tauri-store/svelte";
import type { SplitNode } from "./split-layout";

interface Layout {
	[key: string]: unknown;
	root: SplitNode | null;
}

export const layout = new RuneStore<Layout>(
	"layout",
	{ root: null },
	{
		autoStart: true,
		hooks: {
			beforeBackendSync(state) {
				if (typeof state.root === "string") {
					state.root = null;
				}

				return state;
			},
		},
	},
);
