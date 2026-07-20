# eric-xiang.com

Personal site for Eric Xiang: portfolio, a suite of handy web tools, and Path of Exile resources. Built with [Astro](https://astro.build), React islands, and Tailwind CSS, deployed on [Cloudflare Pages](https://pages.cloudflare.com) with Pages Functions for the backend.

## Sections

- `/` - portfolio landing
- `/projects` - project list + detail pages (Markdown/MDX content collection)
- `/tools` - searchable tools hub (first tool: Unit Converter)
- `/poe` - Path of Exile resources, guides, and live currency prices
- `/about`, `/contact`

## Requirements

- Node.js >= 20.3 (Astro 7 requirement). This repo pins Node via `.nvmrc` (Node 22) - run `nvm use` after cloning.

## Tech stack

- Astro 7 (static output) + `@astrojs/react`, `@astrojs/mdx`, `@astrojs/sitemap`
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Cloudflare Pages (hosting) + Pages Functions (`functions/`) for the API
  - `functions/api/poe/[[path]].ts` - proxies poe.ninja with edge/KV caching
  - `functions/api/contact.ts` - contact form handler (optional Resend delivery)

## Local development

```bash
nvm use        # switches to the Node version in .nvmrc
npm install
npm run dev
```

Astro's dev server does not run the Cloudflare Pages Functions in `functions/`.
To test the site together with the API locally, build and serve with Wrangler:

```bash
npm run build
npm run preview   # wrangler pages dev ./dist
```

## Commands reference

`astro` is a local dependency, not a global binary. Run it via the npm scripts
below or with `npx astro <cmd>` - typing `astro ...` directly gives
`command not found`. Run all commands from the project root, and run `nvm use`
first in a fresh terminal so you're on the pinned Node version.

| Command | What it does |
| --- | --- |
| `nvm use` | Switch to the Node version in `.nvmrc` (Node 22) |
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at http://localhost:4321 |
| `npm run dev -- --port 4322` | Start the dev server on a different port |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the build with Wrangler (runs Pages Functions too) |
| `npm run check` | Type-check `.astro`/`.ts`/`.tsx` (`astro check`) |
| `npm run deploy` | Build and deploy to Cloudflare Pages via Wrangler |
| `npm run kill` | Force-stop whatever is listening on port 4321 |
| `npx astro <cmd>` | Run any Astro subcommand (e.g. `npx astro sync`, `npx astro add`) |

### Stopping / cleaning up the dev server

- In the terminal running the server, press **Ctrl+C** for a clean shutdown.
- If a server is orphaned and still holds the port, free it with:

```bash
npm run kill
# or directly:
lsof -ti tcp:4321 | xargs kill -9
```

- Confirm the port is free:

```bash
lsof -nP -iTCP:4321 -sTCP:LISTEN || echo "port 4321 is free"
```

## Deploy (Cloudflare Pages)

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages -> Create -> Pages -> Connect to Git**.
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add the custom domain `eric-xiang.com` under the project's **Custom domains** tab (Cloudflare manages DNS + HTTPS automatically).

Set `NODE_VERSION=22` in the Pages project's environment variables so the build uses a Node version compatible with Astro 7 (the `.nvmrc` is also auto-detected).

### Optional: KV cache for the PoE proxy

```bash
npx wrangler kv namespace create POE_CACHE
```

Add the returned id to `wrangler.toml` (uncomment the `[[kv_namespaces]]` block)
and bind `POE_CACHE` in the Pages project settings. Without it, the proxy still
works using Cloudflare's edge cache.

### Optional: contact email delivery

Set these environment variables in the Pages project settings to deliver
messages via [Resend](https://resend.com):

- `RESEND_API_KEY`
- `CONTACT_TO`
- `CONTACT_FROM`

Without them, the form validates and accepts submissions (logged in function
output) so it works out of the box.

### Optional: Cloudflare Web Analytics

Enable **Web Analytics** for the domain in the Cloudflare dashboard - it can be
turned on with zero code changes (automatic injection) for Pages projects.

## Adding a new tool

1. Add an entry to `src/lib/tools.ts`.
2. Create `src/pages/tools/<slug>.astro`.
3. For interactivity, add a React island under `src/components/tools/` and mount
   it with `client:load`.

## Content

- Projects: add Markdown/MDX files to `src/content/projects/`.
- PoE guides: add Markdown/MDX files to `src/content/poe/`.

Schemas are defined in `src/content.config.ts`.
