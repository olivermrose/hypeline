import "unplugin-icons/types/svelte";
import type { Component } from "svelte";

interface TitleBar {
	icon: string | Component;
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
