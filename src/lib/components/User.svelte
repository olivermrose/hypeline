<script lang="ts">
	import { Popover } from "bits-ui";
	import type { User } from "$lib/user.svelte";

	interface Props {
		user: User;
		action?: boolean;
		mention?: boolean;
	}

	const { user, action = false, mention = false }: Props = $props();
</script>

<Popover.Root>
	<Popover.Trigger class="font-semibold break-words" style={user.style}>
		{user.displayName}
	</Popover.Trigger>{#if !action}:{/if}

	<Popover.Portal>
		<Popover.Content
			class="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 slide-in-from-left-2 z-50 w-72 origin-(--bits-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden"
			side="right"
			sideOffset={8}
		>
			<div class="space-y-2">
				<h4 class="leading-none font-medium">Dimensions</h4>
				<p class="text-muted-foreground text-sm">Set the dimensions for the layer.</p>
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
