<script lang="ts">
	import { getVersion } from "@tauri-apps/api/app";
	import { LogicalPosition } from "@tauri-apps/api/dpi";
	import { appLogDir } from "@tauri-apps/api/path";
	import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
	import { writeText } from "@tauri-apps/plugin-clipboard-manager";
	import { openPath } from "@tauri-apps/plugin-opener";
	import * as os from "@tauri-apps/plugin-os";
	import { Separator, Tabs } from "bits-ui";
	import { toast } from "svelte-sonner";
	import { beforeNavigate, goto } from "$app/navigation";
	import { page } from "$app/state";
	import { log } from "$lib/log";
	import { settings } from "$lib/settings";
	import { categories } from "./categories";
	import Category from "./Category.svelte";

	const platform = os.platform();

	beforeNavigate(async () => {
		await settings.saveNow();
		log.info("Settings saved");
	});

	async function detach() {
		// eslint-disable-next-line no-new
		new WebviewWindow("settings", {
			url: "/settings?detached",
			title: "Settings",
			hiddenTitle: true,
			titleBarStyle: "overlay",
			trafficLightPosition: new LogicalPosition(10, 15),
			decorations: platform !== "windows",
		});

		history.back();
		log.info("Settings detached");
	}

	async function openLogDir() {
		await openPath(await appLogDir());
	}

	async function copyDebugInfo() {
		const appVersion = await getVersion();

		const appInfo = `Hypeline v${appVersion}`;
		const osInfo = `${platform} ${os.arch()} (${os.version()})`;

		await writeText(`${appInfo}\n${osInfo}`);
		toast.success("Debug info copied to clipboard");
	}
</script>

<svelte:document
	onkeydown={(event) => {
		if (event.key === "Escape") history.back();
	}}
/>

<Tabs.Root
	class="relative flex h-full min-h-screen"
	orientation="vertical"
	value={categories[0].label}
>
	<nav class="h-full min-w-44 p-2 pt-0">
		<Tabs.List class="space-y-1">
			{#each categories as category (category.label)}
				<Tabs.Trigger
					class="text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
					value={category.label}
				>
					<span class="iconify size-4 {category.icon}"></span>
					<span class="text-sm">{category.label}</span>
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		<Separator.Root class="bg-border my-1 h-px w-full" />

		<div class="space-y-1">
			<button
				class="text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
				type="button"
				disabled={page.data.detached}
				onclick={detach}
			>
				<span class="iconify lucide--external-link size-4"></span>
				<span class="text-sm">Popout settings</span>
			</button>

			<button class="text-muted-foreground" type="button" onclick={openLogDir}>
				<span class="iconify lucide--folder-open size-4"></span>
				<span class="text-sm">Open logs</span>
			</button>

			<button class="text-muted-foreground" type="button" onclick={copyDebugInfo}>
				<span class="iconify lucide--clipboard size-4"></span>
				<span class="text-sm">Copy debug info</span>
			</button>
		</div>

		<Separator.Root class="bg-border my-1 h-px w-full" />

		<button
			class="text-destructive hover:bg-destructive/10!"
			type="button"
			data-logout
			onclick={() => goto("/auth/logout")}
		>
			<span class="iconify lucide--log-out size-4"></span>
			<span class="text-sm">Log out</span>
		</button>
	</nav>

	<div class="relative grow overflow-y-auto rounded-tl-lg border-t border-l p-4 pb-16">
		{#if !page.data.detached}
			<button
				class="text-muted-foreground group hover:text-foreground absolute top-4 right-4 flex flex-col items-center"
				onclick={() => history.back()}
				aria-label="Close settings"
			>
				<span class="iconify lucide--x size-6"></span>
			</button>
		{/if}

		{#each categories as category (category.label)}
			<Tabs.Content value={category.label}>
				<Category {category} />
			</Tabs.Content>
		{/each}
	</div>
</Tabs.Root>

<style>
	@reference "../../app.css";

	nav :global(button) {
		width: 100%;
		display: flex;
		align-items: center;
		column-gap: --spacing(2);
		border-radius: var(--radius-sm);
		padding: --spacing(1.5) --spacing(2.5);
		transition-property: color, background-color;
		transition-duration: 100ms;
		transition-timing-function: var(--default-transition-timing-function);

		&:not([data-logout]):hover {
			color: var(--color-foreground);
			background-color: var(--color-muted);
		}
	}
</style>
