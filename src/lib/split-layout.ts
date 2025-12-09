import type { DragDropEvents } from "@dnd-kit-svelte/svelte";
import type { PaneGroupProps } from "paneforge";
import { settings } from "$lib/settings";

export type SplitAxis = PaneGroupProps["direction"];
export type SplitDirection = "up" | "down" | "left" | "right";

export interface SplitBranch {
	axis: SplitAxis;
	size?: number;
	before: SplitNode;
	after: SplitNode;
}

export type SplitNode = SplitBranch | string;

type SplitPath = ("before" | "after")[];

export class SplitLayout {
	public get root() {
		return settings.state.layout;
	}

	public set root(value: SplitNode | null) {
		settings.state.layout = value;
	}

	public insert(target: string, newNode: string, branch: SplitBranch) {
		if (!this.root) {
			this.root = target;
			return;
		}

		this.#update(target, (node) => {
			if (typeof node === "string") {
				return { ...branch, size: 50 };
			}

			return {
				axis: branch.axis,
				before: node,
				after: newNode,
				size: 50,
			};
		});
	}

	public insertEmpty(target: string, axis: SplitAxis) {
		const id = `split-${crypto.randomUUID()}`;

		this.insert(target, id, {
			axis,
			before: target,
			after: id,
		});
	}

	public remove(target: string) {
		if (!this.root) return;

		if (this.root === target) {
			this.root = null;
			return;
		}

		if (typeof this.root !== "string") {
			if (this.root.before === target) {
				this.root = this.root.after;
				return;
			}

			if (this.root.after === target) {
				this.root = this.root.before;
				return;
			}
		}

		this.root = this.#remove(this.root, target);
	}

	public replace(target: string, replacement: string) {
		if (!this.root || target === replacement) return;

		this.#update(target, () => replacement);
	}

	public handleDragEnd(event: Parameters<DragDropEvents["dragend"]>[0]) {
		const { source, target } = event.operation;
		if (!source || !target || source.id === target.id) return;

		const [sourceId] = source.id.toString().split(":");
		const [targetId, position] = target.id.toString().split(":");

		if (sourceId === targetId) return;

		this.remove(sourceId);

		if (position === "center") {
			this.replace(targetId, sourceId);
			return;
		}

		const isVertical = position === "up" || position === "down";
		const isFirst = position === "up" || position === "left";

		this.insert(targetId, sourceId, {
			axis: isVertical ? "vertical" : "horizontal",
			before: isFirst ? sourceId : targetId,
			after: isFirst ? targetId : sourceId,
		});
	}

	#find(node: SplitNode, target: string): SplitPath | null {
		if (typeof node === "string") {
			return node === target ? [] : null;
		}

		const bPath = this.#find(node.before, target);
		if (bPath) return ["before", ...bPath];

		const aPath = this.#find(node.after, target);
		if (aPath) return ["after", ...aPath];

		return null;
	}

	#update(target: string, updater: (node: SplitNode) => SplitNode) {
		const path = this.#find(this.root!, target);

		if (path) {
			this.root = this.#applyUpdate(this.root!, path, updater);
		}
	}

	#applyUpdate(
		node: SplitNode,
		path: SplitPath,
		updater: (node: SplitNode) => SplitNode,
	): SplitNode {
		if (!path.length) return updater(node);

		if (typeof node === "string") {
			throw new TypeError("Path continues but node is a leaf");
		}

		const [side, ...rest] = path;

		return {
			...node,
			[side]: this.#applyUpdate(node[side], rest, updater),
		};
	}

	#remove(node: SplitNode, target: string): SplitNode {
		if (typeof node === "string") return node;

		if (node.before === target) return node.after;
		if (node.after === target) return node.before;

		return {
			...node,
			before: this.#remove(node.before, target),
			after: this.#remove(node.after, target),
		};
	}
}
