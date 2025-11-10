import type { Component } from "svelte";

export interface GroupField {
	type: "group";
	label: string;
	items: SettingsField[];
}

export interface BaseField {
	id: string;
	label: string;
	description?: string;
	disabled?: boolean;
	model: any;
}

export interface CustomField extends Omit<BaseField, "id" | "model"> {
	type: "custom";
	component: Component;
}

export interface InputField extends BaseField {
	type: "input";
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
	icon: string;
	label: string;
	settings: SettingsField[];
}
