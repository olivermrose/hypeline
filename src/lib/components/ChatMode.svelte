<script lang="ts">
	import { Popover } from "bits-ui";
	import type { Chat } from "$lib/models/chat.svelte";

	interface Props {
		class?: string;
		chat: Chat;
	}

	const { class: className, chat }: Props = $props();

	const config = [
		{ key: "subOnly", label: "Subscribers only" },
		{ key: "followerOnly", label: "Followers only" },
		{ key: "slow", label: "Slow mode" },
		{ key: "unique", label: "Unique messages" },
		{ key: "emoteOnly", label: "Emotes only" },
	] as const;

	const modes = $derived(
		config.map((mode) => {
			const value = chat.mode[mode.key];
			const active =
				typeof value === "number"
					? mode.key === "followerOnly"
						? value >= 0
						: value > 0
					: value;

			return { active, ...mode };
		}),
	);

	const topMostActive = $derived(modes.find((m) => m.active));
</script>

<div class={["text-muted-foreground px-1", className]}>
	<Popover.Root>
		<Popover.Trigger class={["flex items-center", topMostActive && "text-green-500"]}>
			<div class="mr-1 size-1.5 rounded-full bg-current/50"></div>

			<span class="text-xs">
				{topMostActive?.label ?? "No active chat modes"}
			</span>
		</Popover.Trigger>

		<Popover.Content
			class="bg-muted rounded-md border p-2 text-xs focus-visible:outline-none"
			sideOffset={4}
			collisionPadding={8}
		>
			<ul class="space-y-1">
				{#each modes as mode}
					<li class={["flex items-center", mode.active && "text-green-500"]}>
						<div class="mr-1 size-1.5 rounded-full bg-current/50"></div>

						{mode.label}

						{#if mode.key === "followerOnly" && typeof chat.mode.followerOnly === "number" && chat.mode.followerOnly > 0}
							({chat.mode.followerOnly} minutes)
						{/if}

						{#if mode.key === "slow" && typeof chat.mode.slow === "number" && chat.mode.slow > 0}
							({chat.mode.slow} seconds)
						{/if}
					</li>
				{/each}
			</ul>
		</Popover.Content>
	</Popover.Root>
</div>
