import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CATEGORIES } from "../types";
import type { AiFields } from "./guards";

/**
 * Claude API calls. Server-only: the key never reaches the browser.
 * AI is on when ANTHROPIC_API_KEY is set (AI_ASSIST=off turns it off). Every call has an 8 s timeout and
 * returns null on any failure, so the app falls back to the rule-based reader and the standard message.
 */
export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY && process.env.AI_ASSIST !== "off";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 8000, maxRetries: 1 });
}

async function ask(system: string, user: string, maxTokens: number): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const msg = await client().messages.create({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] });
    const block = msg.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : null;
  } catch (e) {
    // Never log the enquiry text or customer details; the status code is enough to debug.
    console.error("[ai] call failed", e instanceof Anthropic.APIError ? e.status : "network/timeout");
    return null;
  }
}

/* ---------- 1. Read the enquiry ---------- */

const fieldsSchema = z.object({
  category: z.enum(CATEGORIES).nullable(),
  purity: z.enum(["24K", "22K", "18K"]).nullable(),
  weight_min_g: z.number().positive().nullable(),
  weight_max_g: z.number().positive().nullable(),
  design_notes: z.string().max(300).nullable(),
  language: z.enum(["english", "hinglish", "hindi", "marathi", "other"]).nullable(),
});

const EXTRACT_SYSTEM = `You read customer enquiries sent to Indian jewellers on WhatsApp. Messages may mix English, Hindi, Hinglish and Marathi.
Return ONLY a JSON object, no other text:
{"category": one of ${JSON.stringify(CATEGORIES)} or null, "purity": "24K"|"22K"|"18K"|null, "weight_min_g": number|null, "weight_max_g": number|null, "design_notes": short English description of the design wanted or null, "language": "english"|"hinglish"|"hindi"|"marathi"|"other"}
Rules:
- Use null for anything not clearly stated. Never guess.
- A bare number with no unit is NOT a weight or a purity.
- For one weight ("5 gram") set min and max to that number. For a range ("5-6 gm") use both ends as written.
- 916 means 22K, 750 means 18K, 999 means 24K.
- Hinglish words: anguthi = Ring, haar = Necklace, jhumka/bali = Earrings, kangan/chudi/kada = Bangle, mangalsutra = Chain, locket = Pendant.
- Never mention, estimate or calculate any price.`;

export async function aiExtract(text: string): Promise<AiFields | null> {
  const out = await ask(EXTRACT_SYSTEM, text.slice(0, 2000), 300);
  if (!out) return null;
  try {
    const parsed = fieldsSchema.safeParse(JSON.parse(out.replace(/^```(?:json)?\s*|\s*```$/g, "")));
    if (!parsed.success) return null;
    const d = parsed.data;
    return { category: d.category, purity: d.purity, weightMin: d.weight_min_g, weightMax: d.weight_max_g, designNotes: d.design_notes, language: d.language };
  } catch {
    return null;
  }
}

/* ---------- 2. Draft the WhatsApp reply ---------- */

const REPLY_SYSTEM = `You write short, warm WhatsApp replies for an Indian jewellery shop answering a customer's quotation request.
Write in the same language and style as the customer's message (English, Hinglish, Hindi or Marathi). Address the customer by first name if given.
You must NOT write any number, price, rate, weight, percentage, date or link yourself. Use these placeholders instead, exactly as written:
{DESIGN} design name · {PURITY} gold purity · {WEIGHT} weight range · {TOTAL} total estimate incl. GST · {RATE} today's gold rate per 10 g · {LOCK} rate-lock terms · {LINK} quote link
Use {TOTAL} exactly once and {LINK} exactly once. You may use the others once each.
Mention the design they asked for (from the notes) in a natural way, say the price is based on today's gold rate, and invite them to open the link for the full breakup and IBJA comparison.
Keep it under 90 words, 3–5 short lines, at most one emoji. No bullet points, no markdown. Reply with the message text only.`;

export async function aiDraftReply(input: {
  enquiryText: string | null;
  customerFirstName: string | null;
  shopName: string;
  designNotes: string | null;
}): Promise<string | null> {
  const user = [
    `Shop: ${input.shopName}`,
    `Customer first name: ${input.customerFirstName ?? "(not given)"}`,
    `Design notes: ${input.designNotes ?? "(none)"}`,
    `Customer's message: ${input.enquiryText?.slice(0, 1500) ?? "(not given)"}`,
  ].join("\n");
  return ask(REPLY_SYSTEM, user, 400);
}
