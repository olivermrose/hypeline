<script lang="ts">
	import { getAllWebviewWindows } from "@tauri-apps/api/webviewWindow";
	import { ScrollArea } from "bits-ui";
	import { goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import ChannelList from "./ChannelList.svelte";
	import JoinDialog from "./JoinDialog.svelte";

	let joinOpen = $state(false);

	const unread = $derived(app.user?.whispers.values().reduce((sum, w) => sum + w.unread, 0));

	async function openSettings() {
		const windows = await getAllWebviewWindows();
		const settingsWindow = windows.find((win) => win.label === "settings");

		if (settingsWindow) {
			await settingsWindow.setFocus();
		} else {
			await goto("/settings");
		}
	}
</script>

<JoinDialog bind:open={joinOpen} />

<ScrollArea.Root>
	<ScrollArea.Viewport class="h-full min-h-screen">
		<nav class="h-full space-y-4 p-3 pt-0">
			<div class="space-y-2.5">
				<button
					class="sidebar-button"
					title="Settings"
					type="button"
					onclick={openSettings}
					aria-label="Open settings"
				>
					<span class="lucide--settings iconify"></span>
				</button>

				<a
					class="sidebar-button relative"
					title="Whispers"
					href="/whispers"
					aria-label="Go to whispers"
				>
					{#if unread}
						<div
							class="absolute -top-1/3 -right-1/3 flex size-5 -translate-x-1/3 translate-y-1/3 items-center justify-center rounded-full bg-red-500 text-xs font-medium shadow-md"
						>
							{unread > 9 ? "9+" : unread}
						</div>
					{/if}

					<span class="lucide--message-square iconify"></span>
				</a>

				<button
					class="sidebar-button"
					title="Join a channel"
					type="button"
					onclick={() => (joinOpen = true)}
					aria-label="Join a channel"
				>
					<span class="lucide--plus iconify"></span>
				</button>
			</div>

			<ChannelList />
		</nav>
	</ScrollArea.Viewport>

	<ScrollArea.Scrollbar
		class={[
			"w-2 p-0.5",
			"data-[state=hidden]:fade-out-0 data-[state=visible]:fade-in-0 data-[state=visible]:animate-in data-[state=hidden]:animate-out",
		]}
		orientation="vertical"
	>
		<ScrollArea.Thumb class="bg-muted-foreground/80 rounded-full" />
	</ScrollArea.Scrollbar>
</ScrollArea.Root>

<style>
	@reference "../../app.css";

	.sidebar-button {
		background: var(--color-twitch);
		display: flex;
		align-items: center;
		justify-content: center;
		width: --spacing(10);
		height: --spacing(10);
		border-radius: var(--radius-md);

		.iconify {
			width: --spacing(5);
			height: --spacing(5);
			color: white;
		}
	}
</style>
