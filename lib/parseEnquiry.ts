import type { Category, Purity } from "./types";

/**
 * Rule-based reader for a pasted WhatsApp enquiry. No AI, no network.
 * It never guesses: anything unclear comes back as null and is listed in `missing`.
 * The jeweller confirms or edits every field in the Design step before any price is shown.
 */
export interface ParsedEnquiry {
  category: Category | null;
  purity: Purity | null;
  weightMin: number | null;
  weightMax: number | null;
  missing: ("category" | "purity" | "weight")[];
}

const CATEGORY_WORDS: [Category, RegExp][] = [
  ["Earrings", /\b(earrings?|jhumk[ae]s?|jhumki|bali|balis|studs?|tops)\b|झुमके|झुमका/iu],
  ["Necklace", /\b(necklace|haar|rani haar|choker)\b|हार|नेकलेस/iu],
  ["Bracelet", /\b(bracelets?|kangan)\b|ब्रेसलेट/iu],
  ["Bangle", /\b(bangles?|bangdi|bangadi|choodi|churi|kada|kadaa)\b|बांगड्या|बांगडी|चूड़ी|कड़ा/iu],
  ["Pendant", /\b(pendant|locket)\b|पेंडेंट|लॉकेट/iu],
  ["Chain", /\b(chains?|mangalsutra|mangal sutra)\b|चेन|मंगळसूत्र|मंगलसूत्र/iu],
  ["Ring", /\b(rings?|anguthi|angoothi|angthi)\b|अंगूठी|अंगठी/iu],
];

const NUM = String.raw`(\d+(?:\.\d+)?)`;
const UNIT = String.raw`(?:grams?|gms?|gm|gr|g)\b|ग्राम`;
const RANGE_RE = new RegExp(String.raw`${NUM}\s*(?:-|–|to|se)\s*${NUM}\s*(?:${UNIT})`, "iu");
const SINGLE_RE = new RegExp(String.raw`${NUM}\s*(?:${UNIT})`, "iu");
const PURITY_RE = /\b(24|22|18)\s*(?:k|kt|karat|carat|ct)\b|\b(24|22|18)\s*(?:कैरेट|कॅरेट)/iu;

/** A single weight W becomes the range W−1 to W+1 g (minimum 0.5 g), which the jeweller can edit. */
export function widenWeight(w: number): { weightMin: number; weightMax: number } {
  return { weightMin: Math.max(0.5, Math.round((w - 1) * 10) / 10), weightMax: Math.round((w + 1) * 10) / 10 };
}

export function parseEnquiry(text: string): ParsedEnquiry {
  const t = text.normalize("NFC");
  const missing: ParsedEnquiry["missing"] = [];

  let category: Category | null = null;
  for (const [name, re] of CATEGORY_WORDS) {
    if (re.test(t)) {
      category = name;
      break;
    }
  }
  if (!category) missing.push("category");

  const pm = PURITY_RE.exec(t);
  const purity = pm ? (`${pm[1] ?? pm[2]}K` as Purity) : null;
  if (!purity) missing.push("purity");

  let weightMin: number | null = null;
  let weightMax: number | null = null;
  const range = RANGE_RE.exec(t);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    weightMin = Math.min(a, b);
    weightMax = Math.max(a, b);
  } else {
    const single = SINGLE_RE.exec(t);
    if (single && Number(single[1]) > 0) ({ weightMin, weightMax } = widenWeight(Number(single[1])));
  }
  if (weightMin === null) missing.push("weight");

  return { category, purity, weightMin, weightMax, missing };
}
