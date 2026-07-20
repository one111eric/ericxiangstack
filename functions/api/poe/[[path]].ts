/// <reference types="@cloudflare/workers-types" />

interface Env {
  // Optional KV cache. Bind in wrangler.toml / Pages settings as POE_CACHE.
  POE_CACHE?: KVNamespace;
}

// Cache upstream responses for 10 minutes to respect poe.ninja rate limits.
const CACHE_TTL_SECONDS = 600;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": `public, max-age=${CACHE_TTL_SECONDS}`,
  "access-control-allow-origin": "*",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

/**
 * Build the upstream poe.ninja URL for a supported endpoint.
 * Supported routes:
 *   /api/poe/currency?league=Standard
 *   /api/poe/items?league=Standard&type=UniqueWeapon
 */
function buildUpstream(path: string[], search: URLSearchParams): string | null {
  const league = (search.get("league") || "Standard").trim();
  const [resource] = path;

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params, waitUntil } = context;
  const url = new URL(request.url);
  const path = (Array.isArray(params.path) ? params.path : [params.path]).filter(
    Boolean,
  ) as string[];

  const upstream = buildUpstream(path, url.searchParams);
  if (!upstream) {
    return json(
      {
        error: "Unknown endpoint.",
        supported: ["/api/poe/currency", "/api/poe/items"],
      },
      404,
    );
  }

  const cacheKey = upstream;

  // 1) Try KV cache if bound.
  if (env.POE_CACHE) {
    const cached = await env.POE_CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { ...JSON_HEADERS, "x-cache": "kv-hit" },
      });
    }
  }

  // 2) Fetch upstream.
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
    return json(
      { error: `Upstream returned ${upstreamRes.status}.` },
      upstreamRes.status,
    );
  }

  const body = await upstreamRes.text();

  // 3) Populate KV cache without blocking the response.
  if (env.POE_CACHE) {
    waitUntil(
      env.POE_CACHE.put(cacheKey, body, { expirationTtl: CACHE_TTL_SECONDS }),
    );
  }

  return new Response(body, {
    headers: { ...JSON_HEADERS, "x-cache": "miss" },
  });
};
