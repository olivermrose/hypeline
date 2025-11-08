<script lang="ts">
	import { Popover } from "bits-ui";
	import dayjs from "dayjs";
	import localizedFormat from "dayjs/plugin/localizedFormat";
	import { onMount } from "svelte";
	import { UserMessage } from "$lib/message";
	import type { MentionNode } from "$lib/message";
	import { settings } from "$lib/settings";
	import { User } from "$lib/user.svelte";
	import Message from "./message/Message.svelte";

	dayjs.extend(localizedFormat);

	interface Props {
		message: UserMessage;
		nested?: boolean;
		mention?: MentionNode;
	}

	const { message, nested = false, mention }: Props = $props();

	const user = mention?.data.user ?? message.author;

	let showAllBadges = $state(false);
	const relationship = $derived(user.relationships.get(message.channel.user.username));

	onMount(async () => {
		if (user.partial) {
			await user.fetch();
		}

		if (!relationship) {
			await user.fetchRelationship(message.channel.user.username);
		}
	});

	function getMentionStyle() {
		switch (settings.state.chat.mentionStyle) {
			case "none":
				return null;
			case "colored":
				return `color: ${mention?.data.user?.color}`;
			case "painted":
				return mention?.data.user?.style;
		}
	}
</script>

<Popover.Root>
	{#if mention}
		<Popover.Trigger
			class="font-semibold wrap-break-word disabled:cursor-default"
			disabled={nested}
			style={getMentionStyle()}
		>
			@{mention.data.user?.displayName ?? mention.value.slice(1)}
		</Popover.Trigger>
	{:else}
		<Popover.Trigger
			class="font-semibold wrap-break-word disabled:cursor-default"
			disabled={nested}
			style={message.author.style}
		>
			{message.author.displayName}
		</Popover.Trigger>{#if !message.action}:{/if}
	{/if}

	<Popover.Portal>
		<Popover.Content
			class="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 slide-in-from-left-2 z-50 w-sm origin-(--bits-popover-content-transform-origin) overflow-hidden rounded-md border shadow-md outline-hidden"
			sideOffset={8}
		>
			{@render card(user)}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

{#snippet card(user: User)}
	{@const history = message.channel.messages.filter(
		(m): m is UserMessage => m.isUser() && m.author.id === user.id,
	)}

	<div class="bg-twitch h-18" style:background-color={user.color}>
		{#if user.bannerUrl}
			<img
				class="size-full object-cover"
				src={user.bannerUrl}
				alt=""
				loading="lazy"
				decoding="async"
			/>
		{/if}
	</div>

	<div class="relative border-t p-4">
		<div class="-mt-14">
			<img
				class="border-popover bg-popover size-20 rounded-full border-4 text-sm"
				src={user.avatarUrl}
				alt={user.displayName}
			/>
		</div>

		<div class="text-muted-foreground absolute top-2 right-2 space-y-1 text-xs">
			<div class="flex items-center gap-1">
				<span class="iconify lucide--cake size-3"></span>

				<time datetime={user.createdAt.toISOString()}>
					{dayjs(user.createdAt).format("LL")}
				</time>
			</div>

			<div class="flex items-center gap-1">
				<span class="iconify lucide--heart size-3"></span>

				{#if relationship?.followedAt}
					<time datetime={relationship.followedAt.toISOString()}>
						{dayjs(relationship.followedAt).format("LL")}
					</time>
				{:else}
					Not following
				{/if}
			</div>

			<div class="flex items-center gap-1">
				<span
					class={[
						"iconify size-3",
						relationship?.subscription.hidden || !relationship?.subscription.tier
							? "lucide--star-off"
							: "lucide--star",
					]}
				></span>

				{#if !relationship?.subscription.hidden && relationship?.subscription.months}
					{@const { tier, type, months } = relationship.subscription}
					{@const noun = `month${months > 1 ? "s" : ""}`}

					{#if tier}
						{type === "prime" ? "Prime" : `Tier ${tier}`} - {months}
						{noun}
					{:else}
						{months} {noun}
					{/if}
				{:else}
					Subscription hidden
				{/if}
			</div>
		</div>

		<div class="mt-1 flex flex-col gap-y-2">
			<span class="font-semibold" style={user.style}>{user.displayName}</span>

			{#if relationship?.badges.length}
				{@const badges = showAllBadges
					? relationship.badges
					: relationship.badges.slice(0, 10)}

				<div class="flex flex-wrap items-center gap-1">
					{#each badges as badge (`${badge.setID}:${badge.version}`)}
						<img
							class="size-4"
							src={badge.imageURL}
							alt={badge.title}
							title={badge.title}
						/>
					{/each}

					{#if !showAllBadges && relationship.badges.length > 10}
						<button
							class="text-twitch hover:text-twitch-link ml-1 text-xs transition-colors"
							type="button"
							onclick={() => (showAllBadges = true)}
							aria-label="Show {relationship.badges.length - 10} more badges"
						>
							+{relationship.badges.length - 10} more
						</button>
					{/if}
				</div>
			{/if}

			{#if user.bio}
				<p class="text-muted-foreground text-xs">{user.bio}</p>
			{/if}
		</div>
	</div>

	{#if history.length}
		<div class="max-h-40 overflow-y-auto border-t px-4 py-2">
			{#each history.toReversed() as message (message.id)}
				<div class="origin-left scale-80">
					<Message {message} nested />
				</div>
			{/each}
		</div>
	{/if}
{/snippet}
