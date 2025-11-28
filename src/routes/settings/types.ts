import type { Component, Snippet } from "svelte";

export interface Binding<T> {
	get: () => T;
	set: (value: T) => void;
}

export interface GroupField {
	type: "group";
	label: string;
	fields: SettingsField[];
}

export interface BaseField {
	id: string;
	label: string;
	description?: string | Snippet;
	disabled?: () => boolean;
	binding: Binding<any>;
}

export interface CustomField extends Omit<BaseField, "id" | "binding"> {
	type: "custom";
	component: Component;
}

export interface InputField extends BaseField {
	type: "input";
	placeholder?: string;
}

export interface RadioOption {
	label: string;
	value: string;
}

export interface RadioField extends BaseField {
	type: "radio";
	options: RadioOption[];
}

export interface SliderField extends BaseField {
	type: "slider";
	min: number;
	max: number;
	step?: number;
}

export interface ToggleField extends BaseField {
	type: "toggle";
}

export type SettingsField =
	| GroupField
	| CustomField
	| InputField
	| RadioField
	| SliderField
	| ToggleField;

export interface SettingsCategory {
	label: string;
	icon: Component;
	fields: SettingsField[];
}
