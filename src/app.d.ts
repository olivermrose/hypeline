interface TitleBar {
	icon: string;
	title: string;
}

declare global {
	namespace App {
		interface PageData {
			detached?: boolean;
			titleBar: TitleBar;
		}
	}

	interface RegExpConstructor {
		// eslint-disable-next-line ts/method-signature-style
		escape(string: string): string;
	}
}

export {};
