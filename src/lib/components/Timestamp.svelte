<script lang="ts">
	import dayjs from "dayjs";
	import { settings } from "$lib/settings";

	interface Props {
		date: Date;
	}

	const { date }: Props = $props();

	const format = $derived.by(() => {
		let format = settings.state["appearance.timestamps.format"];

		if (format === "custom") {
			if (settings.state["appearance.timestamps.customFormat"]) {
				return settings.state["appearance.timestamps.customFormat"];
			}

			format = "auto";
		}

		if (format === "auto") {
			const locale = new Intl.Locale(navigator.language);
			// @ts-expect-error - limited support
			const cycles: string[] = locale.getHourCycles?.() ?? [];
			format = cycles.includes("h12") ? "12" : "24";
		}

		return format === "12" ? "h:mm A" : "HH:mm";
	});

	const formatted = $derived(dayjs(date).format(format));
</script>

{#if settings.state["appearance.timestamps.show"]}
	<time class="text-muted-foreground text-xs tabular-nums" datetime={date.toISOString()}>
		{formatted}
	</time>
{/if}
