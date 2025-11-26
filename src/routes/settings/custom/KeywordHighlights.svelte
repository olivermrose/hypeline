<script lang="ts">
	import { Popover, Toggle } from "bits-ui";
	import CaseSensitive from "~icons/local/case-sensitive";
	import Regex from "~icons/local/regex";
	import WholeWord from "~icons/local/whole-word";
	import Plus from "~icons/ph/plus";
	import Trash from "~icons/ph/trash";
	import { Button } from "$lib/components/ui/button";
	import ColorPicker from "$lib/components/ui/ColorPicker.svelte";
	import Input from "$lib/components/ui/Input.svelte";
	import * as Select from "$lib/components/ui/select";
	import { settings } from "$lib/settings";
	import type { KeywordHighlightConfig } from "$lib/settings";
	import { highlightStyles as styles } from "../highlights";

	const defaults: KeywordHighlightConfig = {
		enabled: true,
		pattern: "",
		style: "default",
		color: "#ff0000",
		regex: false,
		wholeWord: false,
		matchCase: false,
	};
</script>

<div>
	<Button onclick={() => settings.state.highlights.keywords.push(defaults)}>
		<Plus />
		Add new trigger
	</Button>

	<div class="overflow-x-auto">
		<div class="grid min-w-max grid-cols-[repeat(7,auto)] gap-x-3 gap-y-4">
			{#each settings.state.highlights.keywords as highlight, i}
				<Input
					class="col-start-1 focus-visible:ring-0"
					type="text"
					bind:value={highlight.pattern}
				/>

				<Toggle.Root
					class={[
						"border-input flex size-9 items-center justify-center justify-self-center rounded-md border bg-transparent",
						"data-[state=on]:dark:bg-input dark:hover:bg-input/50 dark:bg-input/30",
					]}
					title="Match as regular expression"
					aria-label="Match as regular expression"
					bind:pressed={highlight.regex}
				>
					<Regex class="size-4" />
				</Toggle.Root>

				<Toggle.Root
					class={[
						"border-input flex size-9 items-center justify-center justify-self-center rounded-md border bg-transparent",
						"data-[state=on]:dark:bg-input dark:hover:bg-input/50 dark:bg-input/30",
					]}
					title="Match whole word"
					aria-label="Match whole word"
					bind:pressed={highlight.wholeWord}
				>
					<WholeWord class="size-4" />
				</Toggle.Root>

				<Toggle.Root
					class={[
						"border-input flex size-9 items-center justify-center justify-self-center rounded-md border bg-transparent",
						"data-[state=on]:dark:bg-input dark:hover:bg-input/50 dark:bg-input/30",
					]}
					title="Match case"
					aria-label="Match case"
					bind:pressed={highlight.matchCase}
				>
					<CaseSensitive class="size-4" />
				</Toggle.Root>

				<Popover.Root>
					<Popover.Trigger
						class="border-input size-9 shrink-0 justify-self-center rounded-md border bg-(--highlight)"
						--highlight={highlight.color}
					/>

					<Popover.Content class="w-60" sideOffset={10}>
						<ColorPicker
							class="bg-background rounded-md border p-3"
							bind:value={highlight.color}
						/>
					</Popover.Content>
				</Popover.Root>

				<Select.Root
					type="single"
					bind:value={
						() => (highlight.enabled ? highlight.style : "disabled"),
						(value) => {
							if (value === "disabled") {
								highlight.enabled = false;
							} else {
								highlight.enabled = true;
								highlight.style = value;
							}
						}
					}
				>
					<Select.Trigger class="w-full min-w-36">
						{highlight.enabled
							? styles.find((h) => h.value === highlight.style)!.label
							: "Disabled"}
					</Select.Trigger>

					<Select.Content>
						{#each styles as style}
							<Select.Item class="hover:cursor-pointer" value={style.value}>
								{style.label}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<Button
					title="Delete"
					size="icon"
					variant="destructive"
					aria-label="Delete trigger"
					onclick={() => settings.state.highlights.keywords.splice(i, 1)}
				>
					<Trash />
				</Button>
			{/each}
		</div>
	</div>
</div>
