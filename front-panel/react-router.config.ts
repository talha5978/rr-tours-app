import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
	ssr: true,
	presets: [vercelPreset()],
	async prerender() {
		return ["/faqs", "privacy-policy", "/terms-of-usage", "about"];
	},
} satisfies Config;
