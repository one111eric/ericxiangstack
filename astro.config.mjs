// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Static output, deployed via Cloudflare Workers Static Assets. The built
// dist/ is served as static assets, while /api/* is handled by the Worker in
// worker/index.ts (see wrangler.toml). If SSR is ever needed, add the
// @astrojs/cloudflare adapter (already installed) and set output: "server".
export default defineConfig({
  site: "https://eric-xiang.com",
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
