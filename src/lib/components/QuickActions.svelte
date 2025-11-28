<script lang="ts">
	import type { Component, ComponentProps } from "svelte";
	import ArrowBendUpLeft from "~icons/ph/arrow-bend-up-left";
	import Clipboard from "~icons/ph/clipboard";
	import Clock from "~icons/ph/clock";
	import Gavel from "~icons/ph/gavel";
	import Trash from "~icons/ph/trash";
	import type { UserMessage } from "$lib/models/message/user-message";
	import { Button } from "./ui/button";
	import * as ButtonGroup from "./ui/button-group";
	import * as Tooltip from "./ui/tooltip";

	interface Props {
		class?: string;
		message: UserMessage;
	}

	const { class: className, message }: Props = $props();
</script>

<ButtonGroup.Root class={className}>
	{@render button({
		tooltip: "Copy message",
		icon: Clipboard,
		onclick: async () => await navigator.clipboard.writeText(message.text),
	})}

	{@render button({
		tooltip: `Reply to ${message.author.displayName}`,
		icon: ArrowBendUpLeft,
		onclick: () => {
			message.channel.chat.replyTarget = message;
			message.channel.chat.input?.focus();
		},
	})}

	{#if message.actionable}
		<ButtonGroup.Separator orientation="vertical" />

		{@render button({
			class: "text-red-400",
			tooltip: "Delete message",
			icon: Trash,
			onclick: async () => await message.delete(),
		})}

		{@render button({
			class: "text-red-400",
			tooltip: `Timeout ${message.author.displayName} for 10 minutes`,
			icon: Clock,
			onclick: async () => await message.viewer?.timeout({ duration: 600 }),
		})}

		{@render button({
			class: "text-red-400",
			tooltip: `Ban ${message.author.displayName}`,
			icon: Gavel,
			onclick: async () => await message.viewer?.ban(),
		})}
	{/if}
</ButtonGroup.Root>

{#snippet button(props: ComponentProps<typeof Button> & { icon: Component; tooltip: string })}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props: childProps })}
				<Button
					size="icon-sm"
					variant="secondary"
					aria-label={props.tooltip}
					onclick={() => message.viewer?.ban()}
					{...props}
					{...childProps}
				>
					<props.icon />
				</Button>
			{/snippet}
		</Tooltip.Trigger>

		<Tooltip.Content side="top">
			{props.tooltip}
		</Tooltip.Content>
	</Tooltip.Root>
{/snippet}
