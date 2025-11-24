import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

// eslint-disable-next-line node/prefer-global/process
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
	plugins: [
		devtoolsJson(),
		tailwindcss(),
		sveltekit(),
		icons({
			compiler: "svelte",
			customCollections: {
				local: FileSystemIconLoader("./src/assets/icons"),
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
