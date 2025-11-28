<script lang="ts">
	import { Toolbar } from "bits-ui";
	import ArrowBendUpLeft from "~icons/ph/arrow-bend-up-left";
	import Clipboard from "~icons/ph/clipboard";
	import Clock from "~icons/ph/clock";
	import Gavel from "~icons/ph/gavel";
	import Trash from "~icons/ph/trash";
	import type { UserMessage } from "$lib/models/message/user-message";
	import { cn } from "$lib/util";
	import { Separator } from "./ui/separator";

	interface Props {
		class?: string;
		message: UserMessage;
	}

	const { class: className, message }: Props = $props();

	async function copy() {
		await navigator.clipboard.writeText(message.text);
	}
</script>

<Toolbar.Root class={cn("bg-muted flex items-center gap-x-1 rounded-sm border p-0.5", className)}>
	<Toolbar.Button
		class="hover:bg-muted-foreground/50 flex items-center justify-center rounded-sm p-1"
		title="Copy message"
		onclick={copy}
	>
		<Clipboard class="size-4" />
	</Toolbar.Button>

	<Toolbar.Button
		class="hover:bg-muted-foreground/50 flex items-center justify-center rounded-sm p-1"
		title="Reply to {message.author.displayName}"
		onclick={() => {
			message.channel.chat.replyTarget = message;
			message.channel.chat.input?.focus();
		}}
	>
		<ArrowBendUpLeft class="size-4" />
	</Toolbar.Button>

	{#if message.actionable}
		<Separator orientation="vertical" />

		<Toolbar.Button
			class="hover:bg-muted-foreground/50 flex items-center justify-center rounded-sm p-1 text-blue-400"
			title="Delete message"
			onclick={() => message.delete()}
		>
			<Trash class="size-4" />
		</Toolbar.Button>

		<Toolbar.Button
			class="hover:bg-muted-foreground/50 flex items-center justify-center rounded-sm p-1 text-yellow-400"
			title="Timeout {message.author.displayName} for 10 minutes"
			onclick={() => message.viewer?.timeout({ duration: 600 })}
		>
			<Clock class="size-4" />
		</Toolbar.Button>

		<Toolbar.Button
			class="hover:bg-muted-foreground/50 text-destructive flex items-center justify-center rounded-sm p-1"
			title="Ban {message.author.displayName}"
			onclick={() => message.viewer?.ban()}
		>
			<Gavel class="size-4" />
		</Toolbar.Button>
	{/if}
</Toolbar.Root>
