<script lang="ts">
	import Switch from "$lib/components/ui/Switch.svelte";
	import { settings } from "$lib/settings";
	import Group from "../Group.svelte";
</script>

<Group title="Emotes">
	<Switch bind:checked={settings.state.chat.emotes.ffz}>
		<span class="font-medium">
			Show <a class="text-twitch-link" href="https://www.frankerfacez.com/">FrankerFaceZ</a> emotes
		</span>
	</Switch>

	<Switch bind:checked={settings.state.chat.emotes.bttv}>
		<span class="font-medium">
			Show <a class="text-twitch-link" href="https://betterttv.com/">BetterTTV</a> emotes
		</span>
	</Switch>

	<Switch bind:checked={settings.state.chat.emotes.seventv}>
		<span class="font-medium">
			Show <a class="text-twitch-link" href="https://7tv.app/">7TV</a> emotes
		</span>
	</Switch>
</Group>
