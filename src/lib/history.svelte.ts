import { page } from "$app/state";

export class History {
	#stack = $state<string[]>([page.url.pathname]);
	#index = $state(0);

	public readonly canGoBack = $derived(this.#index > 0);
	public readonly canGoForward = $derived(this.#index < this.#stack.length - 1);

	public push(path: string) {
		const newStack = this.#stack.slice(0, this.#index + 1);
		newStack.push(path);

		this.#stack = newStack;
		this.#index = newStack.length - 1;
	}

	public back() {
		if (this.canGoBack) {
			this.#index--;
			history.back();
		}
	}

	public forward() {
		if (this.canGoForward) {
			this.#index++;
			history.forward();
		}
	}
}
