<script lang="ts">
	import { openUrl } from "@tauri-apps/plugin-opener";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		href: string;
	}

	const { children, href, ...rest }: Props = $props();
</script>

<span
	class="text-twitch-link underline hover:cursor-pointer"
	role="link"
	tabindex="0"
	onclick={() => openUrl(href)}
	onkeydown={(event) => {
		if (event.key === "Enter") openUrl(href);
	}}
	{...rest}
>
	{@render children?.()}
</span>
