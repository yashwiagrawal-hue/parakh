import { NextResponse } from "next/server";
import { getQuote, updateQuoteStatus } from "@/lib/db";
import { SLUG_RE } from "@/lib/quotes";

export const dynamic = "force-dynamic";

/**
 * Called by the customer page in the browser on first open. Link-preview crawlers (WhatsApp)
 * don't run scripts, so they don't mark a quote as Viewed.
 */
export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  if (!SLUG_RE.test(params.slug)) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  const q = await getQuote(params.slug);
  if (!q) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  if (q.status === "Sent") await updateQuoteStatus(q.slug, { status: "Viewed", viewedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
