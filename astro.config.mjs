// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Static output + Cloudflare Pages Functions (functions/ dir) for the backend.
// This keeps the site fully static/CDN-served while /api/* is handled by
// Cloudflare Pages Functions. If SSR is ever needed, add the
// @astrojs/cloudflare adapter (already installed) and set output: "server".
export default defineConfig({
  site: "https://eric-xiang.com",
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
