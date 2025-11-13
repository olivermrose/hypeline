<script lang="ts">
	import dayjs from "dayjs";
	import relativeTime from "dayjs/plugin/relativeTime";
	import type { Attachment } from "svelte/attachments";

	dayjs.extend(relativeTime);

	const { data } = $props();

	function relative(date: Date): Attachment {
		return (element) => {
			let interval: number | undefined;

			const now = new Date();
			const offset = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

			setTimeout(() => {
				element.textContent = dayjs(date).fromNow();

				interval = setInterval(() => {
					element.textContent = dayjs(date).fromNow();
				}, 60 * 1000);
			}, offset);

			return () => clearInterval(interval);
		};
	}
</script>

{#each data.whispers as [id, whisper]}
	{@const message = whisper.latest}

	{#if message}
		<div
			class="hover:bg-muted/80 relative flex items-center border-b py-4 pr-6 pl-5 transition-colors"
		>
			<a
				class="absolute inset-0 z-1"
				href="/whispers/{id}"
				aria-label="Go to whisper with {message.user.displayName}"
				data-sveltekit-preload-data="off"
			></a>

			<img
				class="mr-3 rounded-full"
				src={message.user.avatarUrl}
				alt={message.user.displayName}
				width="56"
				height="56"
			/>

			<div class="flex w-full flex-col">
				<div class="flex items-center justify-between">
					<span class="font-semibold" style={message.user.style}>
						{message.user.displayName}
					</span>

					<time
						class="text-muted-foreground text-sm"
						datetime={message.createdAt.toISOString()}
						{@attach relative(message.createdAt)}
					>
						{dayjs(message.createdAt).fromNow()}
					</time>
				</div>

				<div class="flex justify-between">
					<p class={["text-sm", !whisper.unread && "text-muted-foreground"]}>
						{message.text}
					</p>

					{#if whisper.unread}
						<div
							class="bg-twitch mt-1 flex size-6 items-center justify-center rounded-full p-1 text-xs font-medium"
						>
							{whisper.unread > 9 ? "9+" : whisper.unread}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div class="flex size-full flex-col items-center justify-center p-6 text-center">
		<span class="iconify lucide--message-square-dashed mb-4 size-8"></span>

		<span class="text-lg font-medium">No Whispers</span>
		<p class="text-muted-foreground">Any whispers you receive will appear here</p>
	</div>
{/each}
