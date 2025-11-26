<script lang="ts">
	import { ScrollArea } from "bits-ui";
	import { MediaQuery } from "svelte/reactivity";
	import Chats from "~icons/ph/chats";
	import Plus from "~icons/ph/plus";
	import Sidebar from "~icons/ph/sidebar";
	import { app } from "$lib/app.svelte";
	import ChannelList from "./ChannelList.svelte";
	import JoinDialog from "./JoinDialog.svelte";
	import { Button, buttonVariants } from "./ui/button";

	let collapsed = $state(new MediaQuery("(width < 48rem)").current);

	const unread = $derived(app.user?.whispers.values().reduce((sum, w) => sum + w.unread, 0));
</script>

<svelte:document
	onkeydown={(event) => {
		if (event.repeat) return;

		if ((event.metaKey || event.ctrlKey) && event.key === "b") {
			collapsed = !collapsed;
		}
	}}
/>

<ScrollArea.Root class="group" data-state={collapsed ? "collapsed" : "expanded"}>
	<ScrollArea.Viewport class="h-full">
		<div id="sidebar-actions" class="flex flex-col gap-1 px-1.5 py-1">
			<Button
				class="text-muted-foreground hover:text-foreground relative size-11 group-data-[state=expanded]:w-full"
				href="/whispers"
				variant="ghost"
			>
				{#if collapsed && unread}
					<div
						class="absolute -top-1/3 -right-1/3 flex size-5 -translate-x-1/3 translate-y-1/3 items-center justify-center rounded-full bg-red-500 text-xs font-medium shadow-md"
					>
						{unread}
					</div>
				{/if}

				<Chats />

				{#if !collapsed}
					<div class="flex w-full items-center justify-between">
						<span>Whispers</span>

						{#if unread}
							<div
								class="flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium"
							>
								{unread}
							</div>
						{/if}
					</div>
				{/if}
			</Button>

			<JoinDialog
				class={buttonVariants({
					class: "text-muted-foreground hover:text-foreground size-11 group-data-[state=expanded]:w-full group-data-[state=expanded]:justify-start",
					variant: "ghost",
				})}
			>
				<Plus />

				<span class="group-data-[state=collapsed]:hidden">Join a channel</span>
			</JoinDialog>

			<Button
				class="text-muted-foreground hover:text-foreground size-11 group-data-[state=expanded]:w-full group-data-[state=expanded]:justify-start"
				variant="ghost"
				onclick={() => (collapsed = !collapsed)}
			>
				<Sidebar />

				<span class="group-data-[state=collapsed]:hidden">Collapse sidebar</span>
			</Button>
		</div>

		<nav class={["space-y-1.5 pb-3", collapsed ? "w-fit" : "w-56"]}>
			<ChannelList {collapsed} />
		</nav>
	</ScrollArea.Viewport>

	<ScrollArea.Scrollbar
		class={[
			"w-2 p-0.5",
			"data-[state=hidden]:fade-out-0 data-[state=visible]:fade-in-0 data-[state=visible]:animate-in data-[state=hidden]:animate-out",
			"group-data-[state=collapsed]:hidden",
		]}
		orientation="vertical"
	>
		<ScrollArea.Thumb class="bg-muted-foreground/80 rounded-full" />
	</ScrollArea.Scrollbar>
</ScrollArea.Root>
