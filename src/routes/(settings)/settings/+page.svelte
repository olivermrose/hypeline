<script lang="ts">
	import { getVersion } from "@tauri-apps/api/app";
	import { invoke } from "@tauri-apps/api/core";
	import { appLogDir } from "@tauri-apps/api/path";
	import { writeText } from "@tauri-apps/plugin-clipboard-manager";
	import { openPath } from "@tauri-apps/plugin-opener";
	import * as os from "@tauri-apps/plugin-os";
	import { Popover, Separator, Tabs } from "bits-ui";
	import { tick } from "svelte";
	import { beforeNavigate, goto } from "$app/navigation";
	import { app } from "$lib/app.svelte";
	import { categories } from "$lib/components/settings";
	import Category from "$lib/components/settings/Category.svelte";
	import { log } from "$lib/log";
	import { settings } from "$lib/settings";

	let copied = $state(false);

	beforeNavigate(async () => {
		await settings.saveNow();
		log.info("Settings saved");
	});

	async function detach() {
		await invoke("detach_settings");
		history.back();

		log.info("Settings detached");
	}

	async function openLogDir() {
		await openPath(await appLogDir());
	}

	async function copyDebugInfo() {
		const appVersion = await getVersion();

		const appInfo = `Hypeline v${appVersion}`;
		const osInfo = `${os.platform()} ${os.arch()} (${os.version()})`;

		await writeText(`${appInfo}\n${osInfo}`);
		copied = true;

		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	async function logOut() {
		settings.state.user = null;
		settings.state.lastJoined = null;
		app.joined = null;

		await tick();
		await settings.saveNow();

		log.info("User logged out");
		await goto("/auth/login");
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
					class="settings-btn text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
					value={category.label}
				>
					<span class="iconify size-4 {category.icon}"></span>
					<span class="text-sm">{category.label}</span>
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		<Separator.Root class="bg-border my-1 h-px w-full" />

		<div class="space-y-1">
			<button class="settings-btn text-muted-foreground" type="button" onclick={detach}>
				<span class="iconify lucide--external-link size-4"></span>
				<span class="text-sm">Popout settings</span>
			</button>

			<button class="settings-btn text-muted-foreground" type="button" onclick={openLogDir}>
				<span class="iconify lucide--folder-open size-4"></span>
				<span class="text-sm">Open logs</span>
			</button>

			<Popover.Root bind:open={() => copied, () => {}}>
				<Popover.Trigger
					class="settings-btn text-muted-foreground"
					type="button"
					onclick={copyDebugInfo}
				>
					<span class="iconify lucide--clipboard size-4"></span>
					<span class="text-sm">Copy debug info</span>
				</Popover.Trigger>

				<Popover.Content
					class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=top]:slide-in-from-bottom-2 z-50 origin-(--bits-popover-content-transform-origin) rounded-md border bg-green-600 px-2 py-1 text-sm font-medium shadow-md outline-hidden"
					side="top"
				>
					Copied!
				</Popover.Content>
			</Popover.Root>
		</div>

		<Separator.Root class="bg-border my-1 h-px w-full" />

		<button
			class="settings-btn text-destructive hover:bg-destructive/10!"
			type="button"
			data-logout
			onclick={logOut}
		>
			<span class="iconify lucide--log-out size-4"></span>
			<span class="text-sm">Log out</span>
		</button>
	</nav>

	<div class="relative grow overflow-y-auto rounded-tl-lg border-t border-l p-4 pb-16">
		<button
			class="text-muted-foreground group hover:text-foreground absolute top-4 right-4 flex flex-col items-center"
			onclick={() => history.back()}
			aria-label="Close settings"
		>
			<span class="iconify lucide--x size-6"></span>
		</button>

		{#each categories as category (category.label)}
			<Tabs.Content value={category.label}>
				<Category {category} />
			</Tabs.Content>
		{/each}
	</div>
</Tabs.Root>

<style>
	@reference "../../../app.css";

	:global(.settings-btn) {
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
