/**
 * Safety checks around the AI. Pure functions (no network), so they are unit-tested.
 * Rule: AI may read and write words, but every number a customer sees comes from code.
 */
import { CATEGORY_WORDS } from "../parseEnquiry";
import type { Category, Purity } from "../types";

export interface AiFields {
  category: Category | null;
  purity: Purity | null;
  weightMin: number | null;
  weightMax: number | null;
  designNotes: string | null;
  language: "english" | "hinglish" | "hindi" | "marathi" | "other" | null;
}

/** Words that support each purity; 916 and 750 are the hallmark fineness numbers for 22K and 18K. */
const PURITY_EVIDENCE: Record<Purity, RegExp> = {
  "24K": /\b24\s*(?:k|kt|karat|carat|ct)\b|\b999\b|\b24\s*कैरेट/iu,
  "22K": /\b22\s*(?:k|kt|karat|carat|ct)\b|\b916\b|\b22\s*कैरेट/iu,
  "18K": /\b18\s*(?:k|kt|karat|carat|ct)\b|\b750\b|\b18\s*कैरेट/iu,
};

const numbersIn = (text: string) => new Set((text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number));

/**
 * Keep an AI value only if the customer's message supports it; anything else is dropped and flagged
 * so the jeweller sees "Not found in message, please check".
 */
export function checkAgainstText(text: string, ai: AiFields): { fields: AiFields; rejected: ("category" | "purity" | "weight")[] } {
  const t = text.normalize("NFC");
  const nums = numbersIn(t);
  const fields: AiFields = { ...ai, designNotes: ai.designNotes?.slice(0, 200) ?? null };
  const rejected: ("category" | "purity" | "weight")[] = [];

  const wOk = (w: number | null) => w === null || (w > 0 && w < 2000 && nums.has(w));
  if (!wOk(ai.weightMin) || !wOk(ai.weightMax) || (ai.weightMin !== null && ai.weightMax !== null && ai.weightMin > ai.weightMax)) {
    fields.weightMin = fields.weightMax = null;
    rejected.push("weight");
  }
  if (ai.purity && !PURITY_EVIDENCE[ai.purity]?.test(t)) {
    fields.purity = null;
    rejected.push("purity");
  }
  if (ai.category && ai.category !== "Custom/Other") {
    const re = CATEGORY_WORDS.find(([c]) => c === ai.category)?.[1];
    if (!re || !re.test(t)) {
      fields.category = null;
      rejected.push("category");
    }
  }
  return { fields, rejected };
}

/** Placeholders the AI must use instead of writing numbers. Code fills them from the saved quote. */
export const REPLY_PLACEHOLDERS = ["{DESIGN}", "{PURITY}", "{WEIGHT}", "{TOTAL}", "{RATE}", "{LOCK}", "{LINK}"] as const;
const REQUIRED = ["{TOTAL}", "{LINK}"] as const;

/**
 * Accept an AI-written reply only if it uses the required placeholders and contains no numbers or
 * rupee amounts of its own. Returns the filled message, or null so the caller uses the standard template.
 */
export function fillReply(draft: string, values: Record<(typeof REPLY_PLACEHOLDERS)[number], string>): string | null {
  const text = draft.trim();
  if (!text || text.length > 1200) return null;
  if (REQUIRED.some((p) => text.split(p).length !== 2)) return null; // each exactly once
  let stripped = text;
  for (const p of REPLY_PLACEHOLDERS) stripped = stripped.split(p).join("");
  if (/[0-9०-९₹]|\brs\.?\s|\binr\b|https?:|www\./i.test(stripped)) return null; // the AI wrote a number, price or link itself
  if (/\b(lakh|lac|lakhs|crore|thousand|hundred|hazaa?r|rupees?|rupaye|rupay|percent)\b|लाख|हज़ार|हजार|रुपये/i.test(stripped)) return null; // amounts in words
  if (/\{[A-Z_]+\}/.test(stripped)) return null; // unknown placeholder
  let out = text;
  for (const p of REPLY_PLACEHOLDERS) out = out.split(p).join(values[p]);
  return out;
}
