<script lang="ts">
	import HandHeart from "~icons/ph/hand-heart";
	import type { User } from "$lib/models/user.svelte";
	import type { ChannelCharityCampaignDonate } from "$lib/twitch/eventsub";
	import type { CharityDonationEvent } from "$lib/twitch/irc";
	import { colorizeName } from "$lib/util";

	interface Props {
		data: CharityDonationEvent | ChannelCharityCampaignDonate;
		donor: User;
	}

	const { data, donor }: Props = $props();

	function formatCurrency(value: number, code: string) {
		const formatter = new Intl.NumberFormat(navigator.languages, {
			style: "currency",
			currency: code,
		});

		return formatter.format(value);
	}
</script>

<div class="flex gap-1">
	<HandHeart class="mt-0.5 size-4 shrink-0" />

	<div class="flex flex-col gap-0.5">
		{@html colorizeName(donor)}

		{#if "type" in data}
			{@const amount = data.donation_amount / 10 ** data.exponent}

			<p>
				Donated <span class="font-medium"
					>{formatCurrency(amount, data.donation_currency)}</span
				>
				to {data.charity_name}!
			</p>
		{:else}
			{@const amount = data.amount.value / 10 ** data.amount.decimal_places}

			<p>
				Donated <span class="font-medium">
					{formatCurrency(amount, data.amount.currency)}
				</span>
				to <a class="text-twitch-link" href={data.charity_website}>{data.charity_name}</a>
			</p>
		{/if}
	</div>
</div>
