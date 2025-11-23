<script lang="ts">
	import { UserMessage } from "$lib/models/message/user-message";
	import { colorizeName } from "$lib/util";
	import Message from "./Message.svelte";
	import Sub from "./Sub.svelte";

	const { message }: { message: UserMessage } = $props();

	const primary = message.channel.user.color ?? "inherit";

	const colors: Record<string, string[]> = {
		PRIMARY: [primary, primary],
		BLUE: ["#00d6d6", "#9146ff"],
		GREEN: ["#00db84", "#57bee6"],
		ORANGE: ["#ffb31a", "#e0e000"],
		PURPLE: ["#9146ff", "#ff75e6"],
	};
</script>

{#if message.event}
	{@const { type } = message.event}

	{#if type === "announcement"}
		{@const stops = colors[message.event.color]}

		<div
			class="my-1 border-x-6 [border-image-slice:1]"
			style:border-image-source="linear-gradient({stops[0]}, {stops[1]})"
		>
			<div class="bg-muted flex items-center px-2.5 py-1.5 text-xs font-medium">
				<span class="iconify lucide--megaphone mr-2 size-4"></span> Announcement
			</div>

			<div class="bg-muted/50 p-1.5">
				<Message {message} />
			</div>
		</div>
	{:else if type === "sub_or_resub" || type === "sub_mystery_gift" || type === "sub_gift" || type === "prime_paid_upgrade" || type === "gift_paid_upgrade"}
		<Sub {message} sub={message.event} />
	{:else}
		<div
			class="bg-muted/50 my-0.5 border-l-4 p-2"
			style:border-color={message.channel.user.color}
		>
			{#if type === "bits_badge_tier"}
				<div class="flex gap-1">
					<span class="iconify lucide--party-popper mt-px size-4 shrink-0"></span>

					<p>
						{@html colorizeName(message.author)}
						unlocked the {message.event.threshold} bits badge!
					</p>
				</div>

				{#if message.data.message_text}
					<div class="mt-2">
						<Message {message} />
					</div>
				{/if}
			{:else if type === "standard_pay_forward"}
				{@const gifter = message.channel.viewers.get(message.event.prior_gifter.id)}
				{@const recipient = message.channel.viewers.get(message.event.recipient.id)}

				<p>
					{@html colorizeName(message.author)}
					is paying forward the gifted sub they received from

					{#if message.event.is_prior_gifter_anonymous}
						an anonymous gifter
					{:else if gifter}
						{@html colorizeName(gifter)}
					{:else}
						<span class="font-semibold">{message.event.prior_gifter.name}</span>
					{/if} to

					{#if recipient}
						{@html colorizeName(recipient)}
					{:else}
						<span class="font-semibold">{message.event.recipient.name}</span>
					{/if}!
				</p>
			{:else if type === "community_pay_forward"}
				{@const gifter = message.channel.viewers.get(message.event.gifter.id)}

				<p>
					{@html colorizeName(message.author)}
					is paying forward the gifted sub they received from

					{#if gifter}
						{@html colorizeName(gifter)}
					{:else}
						<span class="font-semibold">{message.event.gifter.name}</span>
					{/if}!
				</p>
			{:else if type === "raid"}
				<p class="inline">
					{@html colorizeName(message.author)}
					is raiding with {message.event.viewer_count}
					{message.event.viewer_count > 1 ? "viewers" : "viewer"}!
				</p>
			{:else if type === "unraid"}
				<p class="inline">
					{@html colorizeName(message.author)} canceled the raid.
				</p>
			{:else if type === "one_tap_gift_redeemed"}
				<p>
					{@html colorizeName(message.author)} redeemed {message.event.gift_id} for {message
						.event.bits} bits!
				</p>
			{:else if type === "watch_streak"}
				<div class="flex gap-1">
					<span class="iconify lucide--flame mt-px size-4 shrink-0"></span>

					<p>
						{@html colorizeName(message.author)}
						reached a {message.event.days}-day watch streak!
					</p>
				</div>

				{#if message.data.message_text}
					<div class="mt-2">
						<Message {message} />
					</div>
				{/if}
			{/if}
		</div>
	{/if}
{/if}
