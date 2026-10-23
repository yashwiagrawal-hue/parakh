import "server-only";

/**
 * Protects the AI routes (each call costs money): same-site requests only, and a per-IP limit.
 * In-memory per server instance, which is enough to stop casual abuse.
 * TODO: move to Upstash Redis and put the jeweller pages behind a login.
 */
const hits = new Map<string, { n: number; reset: number }>();

export function guardAiRequest(req: Request, limitPerMinute = 15): string | null {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return "This request must come from the Parakh app.";

  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(ip);
  if (!h || h.reset < now) hits.set(ip, { n: 1, reset: now + 60_000 });
  else if (++h.n > limitPerMinute) return "Too many requests. Wait a minute and try again.";
  return null;
}
