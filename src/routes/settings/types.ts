import type { Component } from "svelte";

export interface Binding<T> {
	get: () => T;
	set: (value: T) => void;
}

interface GroupField {
	type: "group";
	label?: string;
	fields: SettingsField[];
}

export interface BaseField {
	id: string;
	label: string;
	description?: string;
	disabled?: () => boolean;
}

interface BindableField extends BaseField {
	binding: Binding<any>;
}

interface CustomField extends BaseField {
	type: "custom";
	renderAs?: "field" | "set";
	component: Component;
}

interface InputField extends BindableField {
	type: "input";
	placeholder?: string;
}

interface RadioItem {
	label: string;
	value: string;
}

interface RadioField extends BindableField {
	type: "radio";
	items: RadioItem[];
}

interface SliderField extends BindableField {
	type: "slider";
	thumbLabel?: string;
	tickLabel?: string;
	min?: number;
	max?: number;
	step?: number | number[];
}

interface SwitchField extends BindableField {
	type: "switch";
}

export type SettingsField =
	| GroupField
	| CustomField
	| InputField
	| RadioField
	| SliderField
	| SwitchField;

export interface SettingsCategory {
	order: number;
	label: string;
	icon: Component;
	fields: SettingsField[];
}
