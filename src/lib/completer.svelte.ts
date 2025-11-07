import { commands } from "./commands";
import { app } from "./state.svelte";
import type { Channel } from "./channel.svelte";
import type { Command } from "./commands/util";
import type { Suggestion } from "./components/Suggestions.svelte";
import type { Emote } from "./emotes";
import type { Viewer } from "./viewer.svelte";

interface SearchOptions<T> {
	source: () => T[];
	comparee: (item: T) => string;
	map: (item: T) => Suggestion;
}

export class Completer {
	#commandOptions: SearchOptions<Command>;
	#emoteOptions: SearchOptions<Emote>;
	#viewerOptions: SearchOptions<Viewer>;

	public query = "";
	public prefixed = false;

	public current = $state(0);
	public suggestions = $state<Suggestion[]>([]);

	public constructor(
		private readonly channel: Channel,
		public readonly input: HTMLInputElement,
	) {
		this.#commandOptions = {
			source: () => commands,
			comparee: (item) => item.name,
			map: (item) => ({
				type: "command" as const,
				value: item.name,
				display: `/${item.name}`,
				description: item.description,
				args: item.args ?? [],
				broadcasterOnly: item.broadcasterOnly ?? false,
				modOnly: item.modOnly ?? false,
			}),
		};

		this.#emoteOptions = {
			source: () => channel.emotes.values().toArray(),
			comparee: (item) => item.name,
			map: (item) => ({
				type: "emote" as const,
				value: item.name,
				display: item.name,
				imageUrl: item.srcset[1].split(" ")[0],
			}),
		};

		this.#viewerOptions = {
			source: () => channel.viewers.values().toArray(),
			comparee: (item) => item.username,
			map: (item) => ({
				type: "user" as const,
				value: item.username,
				display: item.displayName,
				style: item.user.style,
			}),
		};
	}

	public tab(shift: boolean) {
		// Ignore if in the middle of a word
		if (this.input.value.charAt(this.input.selectionStart ?? 0).trim() !== "") {
			return;
		}

		if (this.prefixed && this.suggestions.length) {
			this.complete();
		} else if (this.suggestions.length) {
			if (shift) {
				this.prev();
			} else {
				this.next();
			}

			this.complete(false);
		} else {
			this.search(true);

			if (this.suggestions.length) {
				this.complete(false);
			}
		}
	}

	public complete(reset = true) {
		const suggestion = this.suggestions[this.current];
		let end = this.input.value.lastIndexOf(this.query);

		if (this.query.startsWith("@")) {
			end++;
		}

		const left = this.input.value.slice(0, end);
		const right = this.input.value.slice(end + this.query.length);

		this.input.value = `${left + suggestion.display} ${right.trim()}`;
		this.input.focus();

		const endPos = end + suggestion.display.length + 1;
		this.input.setSelectionRange(endPos, endPos);

		if (reset) {
			this.reset();
		} else {
			this.query = suggestion.display;
		}
	}

	public search(tab = false) {
		const text = this.input.value;
		const cursor = this.input.selectionStart ?? text.length;

		const left = text.slice(0, cursor);
		const lastWord = left.split(" ").pop();

		if (!lastWord) {
			this.suggestions = [];
			return;
		}

		this.query = lastWord;

		if (this.query.startsWith("/")) {
			this.prefixed = true;
			this.suggestions = this.#search(this.#commandOptions).filter((suggestion) => {
				if (!app.user || suggestion.type !== "command") {
					return false;
				}

				if (suggestion.broadcasterOnly && this.channel.id !== app.user.id) {
					return false;
				}

				if (suggestion.modOnly && !app.user.moderating.has(this.channel.id)) {
					return false;
				}

				return true;
			});
		} else if (this.query.startsWith(":")) {
			this.prefixed = true;
			this.suggestions = this.#search(this.#emoteOptions);
		} else if (this.query.startsWith("@")) {
			this.prefixed = true;
			this.suggestions = this.#search(this.#viewerOptions);
		} else if (tab) {
			this.suggestions = [
				...this.#search(this.#emoteOptions, true),
				...this.#search(this.#viewerOptions, true),
			];
		}
	}

	public next() {
		this.current = (this.current + 1) % this.suggestions.length;
	}

	public prev() {
		this.current = (this.current - 1 + this.suggestions.length) % this.suggestions.length;
	}

	public reset() {
		this.query = "";
		this.prefixed = false;
		this.suggestions = [];
		this.current = 0;
	}

	#search<T>(options: SearchOptions<T>, tab = false) {
		const searchFunction = tab ? "startsWith" : "includes";
		const query = tab ? this.query : this.query.slice(1);

		if (!query) return [];

		return options
			.source()
			.filter((item) =>
				options.comparee(item).toLowerCase()[searchFunction](query.toLowerCase()),
			)
			.slice(0, 25)
			.map(options.map)
			.sort((a, b) => a.value.localeCompare(b.value));
	}
}
