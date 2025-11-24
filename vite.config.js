import fs from "node:fs/promises";
import process from "node:process";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
	plugins: [
		devtoolsJson(),
		tailwindcss(),
		sveltekit(),
		icons({
			compiler: "svelte",
			customCollections: {
				local: {
					"prime-crown": () => fs.readFile("./src/assets/icons/prime-crown.svg", "utf8"),
					"case-sensitive": () =>
						fs.readFile("./src/assets/icons/case-sensitive.svg", "utf8"),
					regex: () => fs.readFile("./src/assets/icons/regex.svg", "utf8"),
					"whole-word": () => fs.readFile("./src/assets/icons/whole-word.svg", "utf8"),
				},
			},
		}),
	],
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: "ws",
					host,
					port: 1421,
				}
			: undefined,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
	build: {
		target: "esnext",
	},
}));
