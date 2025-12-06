import "unplugin-icons/types/svelte";
import type { Component } from "svelte";
import type { SVGAttributes } from "svelte/elements";

interface TitleBar {
	icon: string | Component<SVGAttributes<SVGElement>>;
	title: string;
	guests?: number;
}

declare global {
	namespace App {
		interface PageData {
			detached?: boolean;
			titleBar?: TitleBar;
		}
	}

	interface RegExpConstructor {
		// eslint-disable-next-line ts/method-signature-style
		escape(string: string): string;
	}
}

export {};
