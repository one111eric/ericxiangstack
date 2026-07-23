# eric-xiang.com

Personal site for Eric Xiang: portfolio, a suite of handy web tools, and Path of Exile resources. Built with [Astro](https://astro.build), React islands, and Tailwind CSS, deployed on [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) (Static Assets) with a Worker for the backend API.

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
- Cloudflare Workers with Static Assets: the static `dist/` is served directly, and `worker/index.ts` handles the API
  - `GET /api/poe/*` - proxies poe.ninja with edge/KV caching
  - `POST /api/contact` - contact form handler (optional Resend delivery)
  - `run_worker_first = ["/api/*"]` in `wrangler.toml` means only API routes invoke the Worker; static pages are served without a Worker call

## Local development

```bash
nvm use        # switches to the Node version in .nvmrc
npm install
npm run dev
```

Astro's dev server (`npm run dev`) serves the pages but does not run the Worker
API in `worker/`. To test the site together with the API locally, build and
serve it through Wrangler:

```bash
npm run preview   # astro build && wrangler dev
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
| `npm run preview` | Build, then serve site + Worker API locally via `wrangler dev` |
| `npm run check` | Type-check `.astro`/`.ts`/`.tsx` (`astro check`) |
| `npm run deploy` | Build and deploy to Cloudflare Workers via Wrangler |
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

## Deploy (Cloudflare Workers)

This project deploys as a Worker with Static Assets. With a Git-connected
Workers project, Cloudflare runs the build command and then `npx wrangler deploy`.

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages -> Create -> Import a repository** and select this repo.
3. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy` (default)
4. Ensure the Worker project's **name matches `name` in `wrangler.toml`** (currently `ericxiangstack`), or update the file to match.
5. Add the custom domain `eric-xiang.com` under the Worker's **Domains & Routes** settings (Cloudflare manages DNS + HTTPS automatically).

Set `NODE_VERSION=22` in the project's build environment variables so the build
uses a Node version compatible with Astro 7 (the `.nvmrc` is also auto-detected).

Locally, deploy with:

```bash
npm run deploy   # astro build && wrangler deploy
```

### Optional: KV cache for the PoE proxy

```bash
npx wrangler kv namespace create POE_CACHE
```

Add the returned id to `wrangler.toml` (uncomment the `[[kv_namespaces]]` block).
Without it, the proxy still works using Cloudflare's edge cache.

### Optional: contact email delivery

Set these environment variables (Worker secrets/vars) to deliver messages via
[Resend](https://resend.com):

- `RESEND_API_KEY`
- `CONTACT_TO`
- `CONTACT_FROM`

Without them, the form validates and accepts submissions (logged in Worker
output) so it works out of the box.

### Optional: Cloudflare Web Analytics

Enable **Web Analytics** for the domain in the Cloudflare dashboard - it can be
turned on with zero code changes (automatic injection).

## Adding a new tool

1. Add an entry to `src/lib/tools.ts`.
2. Create `src/pages/tools/<slug>.astro`.
3. For interactivity, add a React island under `src/components/tools/` and mount
   it with `client:load`.

## Content

- Projects: add Markdown/MDX files to `src/content/projects/`.
- PoE guides: add Markdown/MDX files to `src/content/poe/`.

Schemas are defined in `src/content.config.ts`.

### Images in projects

Put source images in `src/assets/projects/` and reference them from the
Markdown body using a path relative to the `.md` file:

```md
![Screenshot of My Project](../../assets/projects/my-project.png)
```

Astro optimizes these at build time (compression, responsive `srcset`, modern
formats). For fixed, un-optimized files (e.g. a downloadable asset), use
`public/` and reference it with an absolute path like `/foo.png`.

### Sizing images (MDX)

Plain `.md` can't size images - the `![alt](src){width=300}` attribute syntax
is **not** supported and renders as literal text. To control size (while
keeping optimization), use the `.mdx` extension and the `<Image>` component:

```mdx
import { Image } from "astro:assets";
import qboAgent from "../../assets/projects/qbo-intelligence/images/qbo-agent.png";

## Overview

{/* Width only - height is derived from the aspect ratio */}
<Image src={qboAgent} alt="QBO Intelligence" width={300} />

{/* Or size with CSS classes (Tailwind) */}
<Image src={qboAgent} alt="QBO Intelligence" class="w-72 rounded-lg" />

{/* Retina: also generate a 2x variant */}
<Image src={qboAgent} alt="QBO Intelligence" width={300} densities={[1, 2]} />
```

Notes:

- Only `.mdx` files can `import` and use components; the content loader already
  picks up both `.md` and `.mdx`, so just rename the file to `.mdx`.
- You can still use plain `![alt](./path.png)` in `.mdx` for full-width images
  that don't need sizing - those are optimized too.
- After renaming a content file, restart `npm run dev` (the dev server's
  content store can otherwise report an empty collection until a restart).
