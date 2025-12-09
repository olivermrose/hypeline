import type { DragDropEvents } from "@dnd-kit-svelte/svelte";
import type { PaneGroupProps } from "paneforge";
import { settings } from "$lib/settings";

export type SplitDirection = "up" | "down" | "left" | "right";

export interface SplitParent {
	direction: PaneGroupProps["direction"];
	first: SplitNode;
	second: SplitNode;
	size?: number;
}

export type SplitNode = SplitParent | string;

type SplitPath = "first" | "second";

export class SplitManager {
	public get root() {
		return settings.state.layout;
	}

	public set root(value: SplitNode | null) {
		settings.state.layout = value;
	}

	public insert(target: string, newNode: string, data: SplitParent) {
		if (!this.root) {
			this.root = target;
			return;
		}

		const path = this.#find(this.root, target);
		if (!path) return;

		this.root = this.#update(this.root, path, (node) => {
			if (typeof node === "string") {
				return { ...data, size: 50 };
			}

			return {
				direction: data.direction,
				first: node,
				second: newNode,
				size: 50,
			};
		});
	}

	public insertEmpty(target: string, direction: PaneGroupProps["direction"]) {
		const id = `split-${crypto.randomUUID()}`;

		this.insert(target, id, {
			direction,
			first: target,
			second: id,
		});
	}

	public remove(target: string) {
		if (!this.root) return;

		if (this.root === target) {
			this.root = null;
			return;
		}

		const path = this.#find(this.root, target);
		if (!path) return;

		const parentPath = path.slice(0, -1);
		const sideToRemove = path.at(-1);

		if (!parentPath.length) {
			if (typeof this.root === "string") return;

			const otherSide = sideToRemove === "first" ? "second" : "first";
			this.root = this.root[otherSide];

			return;
		}

		this.root = this.#replace(this.root, target);
	}

	public replace(target: string, replacement: string) {
		if (!this.root || target === replacement) return;

		const path = this.#find(this.root, target);
		if (!path) return;

		this.root = this.#update(this.root, path, (node) => {
			if (typeof node === "string") {
				return replacement;
			}

			return node;
		});
	}

	public handleDragEnd(event: Parameters<DragDropEvents["dragend"]>[0]) {
		const { source, target } = event.operation;

		if (source && target && source.id !== target.id) {
			const sourceId = source.id.toString();
			const [targetId, position] = target.id.toString().split(":");

			if (sourceId === targetId) return;

			this.remove(sourceId);

			if (position === "center") {
				this.replace(targetId, sourceId);
				return;
			}

			let direction: PaneGroupProps["direction"] = "horizontal";
			let first = targetId;
			let second = sourceId;

			if (position === "up" || position === "down") {
				direction = "vertical";
			}

			if (position === "up" || position === "left") {
				first = sourceId;
				second = targetId;
			}

			this.insert(targetId, sourceId, { direction, first, second });
		}
	}

	#find(node: SplitNode, target: string, path: SplitPath[] = []): SplitPath[] | null {
		if (typeof node === "string") {
			return node === target ? path : null;
		}

		const pathFirst = this.#find(node.first, target, [...path, "first"]);
		if (pathFirst) return pathFirst;

		const pathSecond = this.#find(node.second, target, [...path, "second"]);
		if (pathSecond) return pathSecond;

		return null;
	}

	#update(
		node: SplitNode,
		path: SplitPath[],
		updater: (node: SplitNode) => SplitNode,
	): SplitNode {
		if (!path.length) {
			return updater(node);
		}

		if (typeof node === "string") {
			throw new TypeError("Split path continues but node is a leaf");
		}

		const [side] = path;

		return {
			...node,
			[side]: this.#update(node[side], path.slice(1), updater),
		};
	}

	#replace(node: SplitNode, target: string): SplitNode {
		if (typeof node === "string") {
			if (node === target) {
				throw new Error("Cannot remove root node");
			}

			return node;
		}

		if (node.first === target) return node.second;
		if (node.second === target) return node.first;

		return {
			...node,
			first: this.#replace(node.first, target),
			second: this.#replace(node.second, target),
		};
	}
}
