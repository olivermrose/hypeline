<script lang="ts">
	import { Accordion, Popover } from "bits-ui";
	import { tick } from "svelte";
	import { app } from "$lib/app.svelte";
	import type { EmoteProvider, EmoteSet } from "$lib/emotes";
	import type { Channel } from "$lib/models/channel.svelte";
	import Input from "./ui/Input.svelte";

	interface Props {
		channel: Channel;
		input?: HTMLInputElement | null;
	}

	const { channel, input }: Props = $props();

	let activeSet = $state<string>();
	let sorted = $state.raw<EmoteSet[]>([]);
	let open = $derived(sorted.filter((set) => set.owner.id === channel.id).map((set) => set.id));

	const emoteSets = new Map<string, EmoteSet>();
	const visibleSets = new Set<string>();

	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				visibleSets.add(entry.target.id);
			} else {
				visibleSets.delete(entry.target.id);
			}
		}

		for (const set of sorted) {
			if (visibleSets.has(set.id)) {
				activeSet = set.id;
				break;
			}
		}
	});

	$effect(() => {
		app.emoteSets
			.values()
			.filter((set) => set.global)
			.forEach((set) => emoteSets.set(set.id, set));

		app.user?.emoteSets.forEach((set) => emoteSets.set(set.id, set));

		addProvider("7TV");
		addProvider("BetterTTV");
		addProvider("FrankerFaceZ");

		sorted = emoteSets
			.values()
			.toArray()
			.toSorted((a, b) => {
				// Priority: channel specific > channel owned > global
				const pA = a.owner.id === channel.id ? 0 : a.global ? 2 : 1;
				const pB = b.owner.id === channel.id ? 0 : b.global ? 2 : 1;

				return pA !== pB ? pA - pB : a.name.localeCompare(b.name);
			});

		return () => emoteSets.clear();
	});

	function observe(node: HTMLElement) {
		observer.observe(node);

		return () => observer.unobserve(node);
	}

	function addProvider(provider: EmoteProvider) {
		const emotes = channel.emotes
			.values()
			.filter((emote) => emote.provider === provider)
			.toArray();

		if (!emotes.length) return;

		emoteSets.set(`${provider}:${channel.id}`, {
			id: `${provider}:${channel.id}`,
			name: `${channel.user.displayName}: ${provider}`,
			owner: channel.user,
			global: false,
			emotes,
		});
	}

	function appendEmote(name: string) {
		if (!input) return;

		if (input.value.length > 0) {
			input.value += ` ${name}`;
		} else {
			input.value = name;
		}
	}

	async function scrollToSet(id: string) {
		if (!open.includes(id)) {
			open = [...open, id];
			await tick();
		}

		document.getElementById(id)?.scrollIntoView();
	}

	function toImageSet(srcset: string[]) {
		const candidates: string[] = [];

		for (const src of srcset) {
			const [url, density] = src.split(" ");
			candidates.push(`url("${url}") ${density}`);
		}

		return `image-set(${candidates.join(", ")})`;
	}
</script>

<Popover.Root>
	<Popover.Trigger
		class="text-muted-foreground hover:text-foreground flex size-10 items-center justify-center transition-colors duration-150"
		aria-label="Open emote picker"
	>
		<span class="lucide--smile iconify size-5"></span>
	</Popover.Trigger>

	<Popover.Portal>
		<Popover.Content
			class="bg-sidebar flex max-h-100 overflow-hidden rounded-md border"
			side="top"
			sideOffset={12}
			collisionPadding={8}
		>
			<div class="flex flex-col gap-3 overflow-y-auto p-2">
				{#each sorted as set (set.id)}
					<button class="group" type="button" onclick={() => scrollToSet(set.id)}>
						<img
							class={[
								"size-7 rounded-full object-contain",
								activeSet === set.id && "outline-twitch outline-2",
							]}
							src={set.owner.avatarUrl}
							alt={set.owner.displayName}
							decoding="async"
							loading="lazy"
						/>
					</button>
				{/each}
			</div>

			<div class="flex w-md flex-col border-l">
				<Input
					class="border-border focus-visible:border-border shrink-0 rounded-none rounded-tr-md border-0 border-b focus-visible:ring-0"
					type="search"
					placeholder="Search..."
				/>

				<Accordion.Root
					class="divide-y overflow-y-auto overscroll-none"
					type="multiple"
					bind:value={open}
				>
					{#each sorted as set (set.id)}
						<Accordion.Item
							id={set.id}
							class="group flex flex-col"
							value={set.id}
							{@attach observe}
						>
							<Accordion.Header class="bg-sidebar sticky top-0 z-10 p-2">
								<Accordion.Trigger class="group flex items-center gap-2">
									<img
										class="size-5 rounded-full object-contain"
										src={set.owner.avatarUrl}
										alt={set.owner.displayName}
										decoding="async"
										loading="lazy"
									/>

									<span class="text-sm font-medium">{set.name}</span>
									<span
										class="iconify lucide--chevron-right text-muted-foreground group-data-[state=open]:rotate-90"
									></span>
								</Accordion.Trigger>
							</Accordion.Header>

							{#if open.includes(set.id)}
								<Accordion.Content class="grid grid-cols-9 gap-1.5 px-2 pb-2">
									{#each set.emotes as emote (`${emote.name}:${emote.id}`)}
										<button
											class="w-full"
											title={emote.name}
											type="button"
											onclick={() => appendEmote(emote.name)}
										>
											<div
												class="aspect-square w-full bg-contain bg-center bg-no-repeat"
												style:background-image={toImageSet(emote.srcset)}
											></div>
										</button>
									{/each}
								</Accordion.Content>
							{/if}
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
