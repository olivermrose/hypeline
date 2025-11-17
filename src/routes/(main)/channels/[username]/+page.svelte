<script lang="ts">
	import { listen } from "@tauri-apps/api/event";
	import type { UnlistenFn } from "@tauri-apps/api/event";
	import { onDestroy, onMount } from "svelte";
	import Chat from "$lib/components/Chat.svelte";
	import ChatInput from "$lib/components/ChatInput.svelte";
	import StreamInfo from "$lib/components/StreamInfo.svelte";
	import { handlers } from "$lib/handlers";
	import type { IrcMessage } from "$lib/twitch/irc";

	const { data } = $props();

	let unlisten: UnlistenFn | undefined;

	onMount(async () => {
		unlisten = await listen<IrcMessage[]>("recentmessages", async (event) => {
			for (const message of event.payload) {
				const handler = handlers.get(message.type);
				if (handler?.global) continue;

				await handler?.handle(message, data.channel);
			}
		});
	});

	onDestroy(() => unlisten?.());
</script>

<div class="flex h-full flex-col">
	{#if data.channel.stream}
		<StreamInfo stream={data.channel.stream} />
	{/if}

	<Chat class="grow" chat={data.channel.chat} />

	<div class="p-2">
		<ChatInput chat={data.channel.chat} />
	</div>
</div>
