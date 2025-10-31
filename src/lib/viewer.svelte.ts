import type { Channel } from "./channel.svelte";
import type { BanEvasionEvaluation } from "./twitch/eventsub";
import type { User } from "./user.svelte";

export interface TimeoutOptions {
	duration: number;
	reason?: string;
}

export class Viewer {
	/**
	 * Whether the viewer is the broadcaster.
	 */
	public isBroadcaster = $state(false);

	/**
	 * Whether the viewer is a moderator in the channel.
	 */
	public isMod = $state(false);

	/**
	 * Whether the viewer is a subscriber in the channel.
	 */
	public isSub = $state(false);

	/**
	 * Whether the viewer is a VIP in the channel.
	 */
	public isVip = $state(false);

	/**
	 * Whether the viewer is returning to the channel.
	 *
	 * Returning viewers are those who have chatted at least twice in the
	 * last 30 days.
	 */
	public isReturning = $state(false);

	/**
	 * Whether the viewer's messages are being monitored. This is mutually
	 * exclusive with `restricted`.
	 */
	public monitored = $state(false);

	/**
	 * Whether the viewer's messages are being restricted. This is mutually
	 * exclusive with `monitored`.
	 */
	public restricted = $state(false);

	/**
	 * The likelihood that the viewer is ban evading if they are considered
	 * {@link isSuspicious suspicious}.
	 */
	public banEvasion = $state<BanEvasionEvaluation>("unknown");

	public constructor(
		/**
		 * The channel the viewer is in.
		 */
		public readonly channel: Channel,

		/**
		 * The user representing the viewer.
		 */
		public readonly user: User,
	) {}

	public get id() {
		return this.user.id;
	}

	public get username() {
		return this.user.username;
	}

	public get displayName() {
		return this.user.displayName;
	}

	/**
	 * Whether the viewer is considered suspicious in a channel i.e. their
	 * messages are being monitored or restricted, or they are suspected of ban
	 * evasion.
	 */
	public get isSuspicious() {
		return this.monitored || this.restricted || this.banEvasion !== "unknown";
	}

	public async ban(reason?: string) {
		return this.channel.viewers.ban(this.id, reason);
	}

	public async timeout(options: TimeoutOptions) {
		return this.channel.viewers.timeout(this.id, options);
	}

	public async warn(reason: string) {
		return this.channel.viewers.warn(this.id, reason);
	}
}
