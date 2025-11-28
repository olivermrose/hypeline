<script lang="ts" module>
	import Link from "$lib/components/Link.svelte";

	export const descriptions = {
		customFormat,
		ffz,
		bttv,
		seventv,
		recentMessages,
	};
</script>

{#snippet customFormat()}
	Formats use the format tokens used by <Link href="https://day.js.org/en">Day.js</Link>; view the
	full list of tokens and their descriptions
	<Link href="https://day.js.org/docs/en/display/format">here</Link> (note that localized formats are
	not enabled).
{/snippet}

{#snippet ffz()}
	{@render emotes("https://www.frankerfacez.com/", "FrankerFaceZ")}
{/snippet}

{#snippet bttv()}
	{@render emotes("https://betterttv.com/", "BetterTTV")}
{/snippet}

{#snippet seventv()}
	{@render emotes("https://7tv.app/", "7TV")}
{/snippet}

{#snippet recentMessages()}
	This feature uses a <Link href="https://recent-messages.robotty.de/">third-party API</Link> that
	temporarily stores the messages sent in joined channels. To opt-out, disable this setting.
{/snippet}

<!------->

{#snippet emotes(href: string, label: string)}
	Show and autocomplete emotes from <Link {href}>{label}</Link>.
{/snippet}
