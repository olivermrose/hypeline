<script lang="ts">
	import { listen } from "@tauri-apps/api/event";
	import type { UnlistenFn } from "@tauri-apps/api/event";
	import { onDestroy, onMount } from "svelte";
	import { app } from "$lib/app.svelte";
	import Chat from "$lib/components/chat/Chat.svelte";
	import ChatInput from "$lib/components/chat/Input.svelte";
	import StreamInfo from "$lib/components/StreamInfo.svelte";
	import { handlers } from "$lib/handlers";
	import type { Channel } from "$lib/models/channel.svelte";
	import type { IrcMessage } from "$lib/twitch/irc";

	interface Props {
		channel: Channel;
	}

	const { channel }: Props = $props();

	let unlisten: UnlistenFn | undefined;

	onMount(async () => {
		if (!channel.joined) {
			await channel.join();
		}

		unlisten = await listen<IrcMessage[]>("recentmessages", async (event) => {
			for (const message of event.payload) {
				await handlers.get(message.type)?.handle(message);
			}
		});
	});

	onDestroy(() => unlisten?.());
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex h-full flex-col" onclick={() => (app.focused = channel)}>
	{#if channel.stream}
		<StreamInfo stream={channel.stream} />
	{/if}

	<Chat class="grow" chat={channel.chat} />

	<div class="p-2">
		<ChatInput chat={channel.chat} />
	</div>
</div>
