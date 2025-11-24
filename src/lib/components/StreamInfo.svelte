<script lang="ts">
	import dayjs from "dayjs";
	import duration from "dayjs/plugin/duration";
	import { onMount } from "svelte";
	import Clock from "~icons/ph/clock";
	import Users from "~icons/ph/users";
	import type { Stream } from "$lib/graphql/fragments";

	dayjs.extend(duration);

	const { stream }: { stream: Stream } = $props();

	let uptime = $state(getUptime());

	onMount(() => {
		let interval: ReturnType<typeof setInterval> | undefined;

		setTimeout(() => {
			interval = setInterval(() => {
				uptime = getUptime();
			}, 1000);
		}, 1000 - new Date().getMilliseconds());

		return () => clearInterval(interval);
	});

	function getUptime() {
		const diff = dayjs.duration(dayjs().diff(dayjs(stream.createdAt)));
		const hours = Math.floor(diff.asHours()).toString().padStart(2, "0");

		return `${hours}:${diff.format("mm:ss")}`;
	}
</script>

<div
	class="bg-sidebar text-muted-foreground flex items-center justify-between overflow-hidden border-b p-2 text-xs"
>
	<p class="truncate" title={stream.title}>{stream.title}</p>

	<div class="ml-[3ch] flex items-center gap-1">
		<div class="flex items-center">
			<Users class="mr-1 size-4" />
			<span class="font-medium">{stream.viewersCount}</span>
		</div>

		&bullet;

		<div class="flex items-center">
			<Clock class="mr-1 size-4" />
			<span class="font-medium tabular-nums">{uptime}</span>
		</div>
	</div>
</div>
