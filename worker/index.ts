/// <reference types="@cloudflare/workers-types" />

// Single Worker entry for the site's backend, deployed via Workers Static
// Assets. Static files in ./dist are served directly by the platform; this
// Worker runs first only for the routes listed in wrangler.toml
// (`run_worker_first = ["/api/*"]`) and handles the API. Anything it doesn't
// recognize falls back to the static assets via the ASSETS binding.

interface Env {
  ASSETS: Fetcher;
  // Optional KV cache for the PoE proxy.
  POE_CACHE?: KVNamespace;
  // Optional Resend config for contact email delivery.
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

// Cache upstream poe.ninja responses for 10 minutes to respect rate limits.
const CACHE_TTL_SECONDS = 600;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...extraHeaders,
    },
  });
}

/** Build the upstream poe.ninja URL for a supported endpoint. */
function buildPoeUpstream(resource: string, search: URLSearchParams): string | null {
  const league = (search.get("league") || "Standard").trim();

  if (resource === "currency") {
    const type = search.get("type") || "Currency"; // Currency | Fragment
    return `https://poe.ninja/api/data/currencyoverview?league=${encodeURIComponent(
      league,
    )}&type=${encodeURIComponent(type)}`;
  }

  if (resource === "items") {
    const type = search.get("type") || "UniqueWeapon";
    return `https://poe.ninja/api/data/itemoverview?league=${encodeURIComponent(
      league,
    )}&type=${encodeURIComponent(type)}`;
  }

  return null;
}

async function handlePoe(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  segments: string[],
): Promise<Response> {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed." }, 405);
  }

  const url = new URL(request.url);
  const resource = segments[0] ?? "";
  const upstream = buildPoeUpstream(resource, url.searchParams);

  if (!upstream) {
    return json(
      { error: "Unknown endpoint.", supported: ["/api/poe/currency", "/api/poe/items"] },
      404,
    );
  }

  const cacheControl = `public, max-age=${CACHE_TTL_SECONDS}`;

  if (env.POE_CACHE) {
    const cached = await env.POE_CACHE.get(upstream);
    if (cached) {
      return new Response(cached, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*",
          "cache-control": cacheControl,
          "x-cache": "kv-hit",
        },
      });
    }
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, {
      headers: { accept: "application/json", "user-agent": "eric-xiang.com" },
      cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true },
    });
  } catch {
    return json({ error: "Failed to reach upstream data source." }, 502);
  }

  if (!upstreamRes.ok) {
    return json({ error: `Upstream returned ${upstreamRes.status}.` }, upstreamRes.status);
  }

  const body = await upstreamRes.text();

  if (env.POE_CACHE) {
    ctx.waitUntil(
      env.POE_CACHE.put(upstream, body, { expirationTtl: CACHE_TTL_SECONDS }),
    );
  }

  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": cacheControl,
      "x-cache": "miss",
    },
  });
}

interface ContactPayload {
  name?: string;
  email?: string;
  message?: string;
  website?: string; // honeypot
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const name = (payload.name || "").trim();
  const email = (payload.email || "").trim();
  const message = (payload.message || "").trim();

  // Silently accept honeypot hits so bots think they succeeded.
  if (payload.website) return json({ ok: true });

  if (!name || !email || !message) {
    return json({ error: "Please fill in all fields." }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (message.length > 5000) {
    return json({ error: "Message is too long." }, 400);
  }

  if (env.RESEND_API_KEY && env.CONTACT_TO && env.CONTACT_FROM) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: env.CONTACT_TO,
        reply_to: email,
        subject: `[eric-xiang.com] Message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      }),
    });
    if (!res.ok) {
      return json({ error: "Could not send message right now." }, 502);
    }
  } else {
    console.log("Contact form submission:", { name, email, message });
  }

  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.startsWith("/api/poe/")) {
      const segments = pathname.replace(/^\/api\/poe\//, "").split("/").filter(Boolean);
      return handlePoe(request, env, ctx, segments);
    }

    if (pathname === "/api/contact") {
      return handleContact(request, env);
    }

    if (pathname.startsWith("/api/")) {
      return json({ error: "Not found." }, 404);
    }

    // Fallback: serve static assets (also covers cases where the Worker is
    // invoked for non-API routes).
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
