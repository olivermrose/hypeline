<script lang="ts">
	import ArrowBendUpRight from "~icons/ph/arrow-bend-up-right";
	import { app } from "$lib/app.svelte";
	import { createMessageMenu } from "$lib/menus/message-menu";
	import type { UserMessage } from "$lib/models/message/user-message";
	import type { Viewer } from "$lib/models/viewer.svelte";
	import { settings } from "$lib/settings";
	import type { HighlightType } from "$lib/settings";
	import { openMenu } from "$lib/util";
	import Highlight from "./Highlight.svelte";
	import Message from "./Message.svelte";
	import QuickActions from "./QuickActions.svelte";

	interface Props {
		message: UserMessage;
	}

	const { message }: Props = $props();

	let hlType = $state<HighlightType>();
	let info = $state<string>();

	const customMatched = $derived(
		settings.state["highlights.keywords"].find((cfg) => {
			if (!cfg.pattern.trim()) return false;

			let pattern = cfg.regex ? cfg.pattern : RegExp.escape(cfg.pattern);

			if (cfg.wholeWord) {
				pattern = `\\b${pattern}\\b`;
			}

			return new RegExp(pattern, cfg.matchCase ? "g" : "gi").test(message.text);
		}),
	);

	const isSelf = message.author.id === app.user?.id;
	const hasMention = message.text.toLowerCase().includes(`@${app.user?.username}`);

	if (message.viewer) {
		if (hasMention) {
			hlType = "mention";
		} else if (message.viewer.new) {
			hlType = "new";
		} else if (message.viewer.returning) {
			hlType = "returning";
		} else if (message.viewer.broadcaster) {
			hlType = "broadcaster";
		} else if (message.viewer.moderator) {
			hlType = "moderator";
		} else if (message.viewer.suspicious) {
			hlType = "suspicious";

			const likelihood = message.viewer.banEvasion;

			if (message.viewer.monitored) {
				info = "Monitoring";
			} else if (message.viewer.restricted) {
				info = "Restricted";
			} else if (likelihood !== "unknown") {
				const status = likelihood[0].toUpperCase() + likelihood.slice(1);
				info = `${status} Ban Evader`;
			}
		} else if (message.viewer.vip) {
			hlType = "vip";
		} else if (message.viewer.subscriber) {
			hlType = "subscriber";
		}
	}

	function getMentionStyle(viewer?: Viewer) {
		if (!viewer) return null;

		switch (settings.state["chat.usernames.mentionStyle"]) {
			case "none":
				return null;
			case "colored":
				return `color: ${viewer.user.color}`;
			case "painted":
				return viewer.user.style;
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group relative aria-disabled:opacity-50"
	aria-disabled={message.deleted}
	oncontextmenu={(event) => openMenu(event, () => createMessageMenu(message))}
>
	{#if !message.deleted && !app.user?.banned.has(message.channel.id)}
		<QuickActions
			class="absolute top-0 right-2 -translate-y-1/2 not-group-hover:hidden"
			{message}
		/>
	{/if}

	{#if message.highlighted}
		<div
			class="bg-muted/50 my-0.5 border-l-4 p-2"
			style:border-color={message.source.user.color}
		>
			<Message {message} />
		</div>
	{:else if settings.state["highlights.enabled"]}
		{@const config = hlType ? settings.state["highlights.viewers"][hlType] : null}

		{#if config && config.enabled}
			<Highlight type={hlType!} {info} {config}>
				{@render content(config.style !== "background")}
			</Highlight>
		{:else if customMatched?.enabled && !isSelf}
			<Highlight type="custom" config={customMatched}>
				{@render content(customMatched.style !== "background")}
			</Highlight>
		{:else}
			{@render content(false)}
		{/if}
	{:else}
		{@render content(false)}
	{/if}
</div>

{#snippet content(bordered: boolean)}
	<div class={["not-group-aria-disabled:hover:bg-muted/50 py-2", bordered ? "px-1.5" : "px-3"]}>
		{#if message.reply}
			{@const viewer = message.channel.viewers.get(message.reply.parent.user.id)}

			<div class="mb-0.5 flex items-center gap-2">
				<ArrowBendUpRight class="text-muted-foreground ml-1 shrink-0 scale-x-125" />

				<div class="line-clamp-1 text-xs">
					<span style={getMentionStyle(viewer)}>
						@{message.reply.parent.user.name}
					</span>:

					<p class="text-muted-foreground inline">
						{message.reply.parent.message_text}
					</p>
				</div>
			</div>
		{/if}

		<Message {message} />
	</div>
{/snippet}
