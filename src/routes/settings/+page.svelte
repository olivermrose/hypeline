<script lang="ts">
	import { Tabs } from "bits-ui";
	import SignOut from "~icons/ph/sign-out";
	import X from "~icons/ph/x";
	import { beforeNavigate, goto } from "$app/navigation";
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator";
	import { log } from "$lib/log";
	import { settings } from "$lib/settings";
	import { categories } from "./categories";
	import Category from "./Category.svelte";
	import SidebarActions from "./SidebarActions.svelte";

	beforeNavigate(async () => {
		await settings.saveNow();
		log.info("Settings saved");
	});
</script>

<svelte:document
	onkeydown={(event) => {
		if (event.key === "Escape") history.back();
	}}
/>

<Tabs.Root
	id="settings-tabs"
	class="relative flex grow overflow-hidden"
	orientation="vertical"
	value={categories[0].label}
>
	<div class="h-full min-w-44 p-2">
		<Tabs.List class="space-y-1">
			{#each categories as category (category.label)}
				<Tabs.Trigger value={category.label}>
					{#snippet child({ props })}
						<Button
							class="text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
							variant="ghost"
							{...props}
						>
							<category.icon />
							{category.label}
						</Button>
					{/snippet}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		<Separator />

		<div class="space-y-1">
			<SidebarActions />
		</div>

		<Separator />

		<Button
			class="text-muted-foreground"
			variant="ghost"
			data-logout
			onclick={async () => await goto("/auth/logout")}
		>
			<SignOut />
			<span class="text-sm">Log out</span>
		</Button>
	</div>

	<div class="bg-accent/15 relative grow overflow-y-auto border-l p-4 pb-8">
		{#if !page.data.detached}
			<Button
				class="absolute top-2 right-2"
				size="icon"
				variant="ghost"
				onclick={() => history.back()}
				aria-label="Close settings"
			>
				<X />
			</Button>
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

	:global(#settings-tabs [data-slot="separator"]) {
		margin: --spacing(2) 0;
	}

	div:first-child :global(button) {
		width: 100%;
		display: flex;
		justify-content: flex-start;

		&:not([data-logout]):hover {
			color: var(--color-foreground);
			background-color: var(--color-muted);
		}
	}
</style>
