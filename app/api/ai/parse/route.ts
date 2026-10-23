import { NextResponse } from "next/server";
import { z } from "zod";
import { aiEnabled, aiExtract } from "@/lib/ai/claude";
import { checkAgainstText } from "@/lib/ai/guards";
import { parseEnquiry, widenWeight } from "@/lib/parseEnquiry";
import { guardAiRequest } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

const body = z.object({ text: z.string().trim().min(1).max(2000) }).strict();

export type FieldFlag = "missing" | "check";

/**
 * Step 1: read a pasted enquiry. AI reads it (when a key is set), every value is checked against the
 * message, and the rule-based reader fills any gap. The jeweller confirms everything in step 2.
 */
export async function POST(req: Request) {
  const blocked = guardAiRequest(req);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Paste the customer's message first." }, { status: 400 });
  const text = parsed.data.text;

  const rules = parseEnquiry(text);
  const ai = await aiExtract(text);
  const flags: Record<string, FieldFlag> = {};

  let category = rules.category;
  let purity = rules.purity;
  let weightMin = rules.weightMin;
  let weightMax = rules.weightMax;
  let designNotes: string | null = null;
  let language: string | null = null;

  if (ai) {
    const { fields, rejected } = checkAgainstText(text, ai);
    for (const r of rejected) flags[r] = "check";
    category = fields.category ?? category;
    purity = fields.purity ?? purity;
    if (fields.weightMin !== null && fields.weightMax !== null) {
      // A single weight becomes a ±1 g range the jeweller can edit.
      ({ weightMin, weightMax } = fields.weightMin === fields.weightMax ? widenWeight(fields.weightMin) : { weightMin: fields.weightMin, weightMax: fields.weightMax });
    }
    designNotes = fields.designNotes;
    language = fields.language;
  }
  if (!category) flags.category ??= "missing";
  if (!purity) flags.purity ??= "missing";
  if (weightMin === null) flags.weight ??= "missing";

  return NextResponse.json({ category, purity, weightMin, weightMax, designNotes, language, flags, aiUsed: !!ai, aiEnabled: aiEnabled() });
}
