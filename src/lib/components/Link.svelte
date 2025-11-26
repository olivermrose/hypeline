<script lang="ts">
	import { openUrl } from "@tauri-apps/plugin-opener";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	interface Props extends HTMLAnchorAttributes {
		href: string;
	}

	const { children, href, ...rest }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<span
	class="text-twitch-link underline hover:cursor-pointer"
	role="link"
	tabindex="-1"
	onclick={() => openUrl(href)}
>
	{@render children?.()}
</span>
