<script lang="ts">
	import { UserMessage } from "$lib/message";
	import type { AutoModMetadata } from "$lib/twitch/eventsub";
	import Message from "./Message.svelte";

	interface Props {
		message: UserMessage;
		metadata: AutoModMetadata;
	}

	const { message, metadata }: Props = $props();
</script>

<div class="bg-muted/50 my-0.5 space-y-2 border-l-4 border-red-500 p-2">
	<div
		class={["flex w-full items-start justify-between gap-x-4", message.deleted && "opacity-30"]}
	>
		<div>
			<img
				class="inline align-middle"
				src="https://static-cdn.jtvnw.net/badges/v1/df9095f6-a8a0-4cc2-bb33-d908c0adffb8/3"
				alt="AutoMod"
				width="18"
				height="18"
			/>

			<span class="text-twitch font-semibold">AutoMod</span>:

			{#if metadata.category === "msg_hold"}
				Your message is being held for review by the moderators and has not been sent.
			{:else}
				Message held {metadata.category}
				{Number.isNaN(metadata.level) ? null : `(Level ${metadata.level})`}
			{/if}
		</div>

		{#if metadata.category !== "msg_hold"}
			<div class="flex gap-x-4">
				<button
					class="text-twitch-link font-medium disabled:cursor-not-allowed"
					type="button"
					disabled={message.deleted}
					onclick={() => message.allow()}
				>
					Allow
				</button>

				<button
					class="text-twitch-link font-medium disabled:cursor-not-allowed"
					type="button"
					disabled={message.deleted}
					onclick={() => message.deny()}
				>
					Deny
				</button>
			</div>
		{/if}
	</div>

	<div class={[message.deleted && "opacity-30"]}>
		<Message {message} />
	</div>
</div>
