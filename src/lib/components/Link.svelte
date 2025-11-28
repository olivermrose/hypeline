<script lang="ts">
	import { openUrl } from "@tauri-apps/plugin-opener";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		href?: string;
	}

	const { children, class: className, href, ...rest }: Props = $props();
</script>

<span
	class={["cursor-pointer text-blue-400 underline transition-colors", className]}
	role="link"
	tabindex="0"
	onclick={async () => {
		if (href) await openUrl(href);
	}}
	onkeydown={async (event) => {
		if (event.key === "Enter" && href) {
			await openUrl(href);
		}
	}}
	{...rest}
>
	{@render children?.()}
</span>
