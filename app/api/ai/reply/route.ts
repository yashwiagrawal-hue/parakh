import { NextResponse } from "next/server";
import { z } from "zod";
import { aiDraftReply } from "@/lib/ai/claude";
import { fillReply } from "@/lib/ai/guards";
import { getJeweller, getQuote } from "@/lib/db";
import { formatINR, formatTotal, formatWeightRange } from "@/lib/format";
import { SLUG_RE } from "@/lib/quotes";
import { guardAiRequest } from "@/lib/server/guard";
import { quoteMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const body = z.object({ slug: z.string().regex(SLUG_RE), designNotes: z.string().max(200).nullable() }).strict();

/**
 * Step 4: draft the WhatsApp reply for a saved quote. The AI writes the words with placeholders;
 * every number (rate, weight, total, lock terms) is filled in here from the saved quote.
 * The jeweller reads and edits the draft, then sends it from their own WhatsApp.
 */
export async function POST(req: Request) {
  const blocked = guardAiRequest(req, 10);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Quote not found." }, { status: 400 });

  const [q, j] = await Promise.all([getQuote(parsed.data.slug), getJeweller()]);
  if (!q) return NextResponse.json({ error: "Quote not found." }, { status: 404 });

  const url = `${new URL(req.url).origin}/q/${q.slug}`;
  const values = {
    "{DESIGN}": q.designName,
    "{PURITY}": q.purity,
    "{WEIGHT}": formatWeightRange(q.weightMin, q.weightMax),
    "{TOTAL}": formatTotal(q.breakdown),
    "{RATE}": `${formatINR(q.rateUsed)}/10g`,
    "{LOCK}": `rate locked for ${q.rateLockDays} days on ${q.rateLockAdvancePct}% advance`,
    "{LINK}": url,
  } as const;

  const draft = await aiDraftReply({
    enquiryText: q.enquiryText,
    customerFirstName: q.customerName?.trim().split(/\s+/)[0] ?? null,
    shopName: j.name,
    designNotes: parsed.data.designNotes,
  });
  const filled = draft ? fillReply(draft, values) : null;
  if (filled) return NextResponse.json({ message: filled, aiUsed: true });

  // AI off, slow, or its draft broke a rule: use the standard message (all numbers from code).
  const message = quoteMessage({
    customerName: q.customerName,
    jewellerName: q.jewellerName,
    designName: q.designName,
    purity: q.purity,
    weightMin: q.weightMin,
    weightMax: q.weightMax,
    breakdown: q.breakdown,
    rateLockDays: q.rateLockDays,
    rateLockAdvancePct: q.rateLockAdvancePct,
    url,
  });
  return NextResponse.json({ message, aiUsed: false, fallback: draft ? "rejected" : "unavailable" });
}
