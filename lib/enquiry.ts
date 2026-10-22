import { z } from "zod";

/**
 * Local, rule-based reader for a pasted WhatsApp enquiry. No AI and no network.
 * It never guesses: anything unclear comes back as null and is listed in `missing`.
 * The jeweller always confirms or edits the fields before any price is shown.
 */
export const enquirySchema = z.object({
  item: z.enum(["ring", "bangle", "chain", "necklace", "earrings", "pendant", "other"]).nullable(),
  purity: z.enum(["22K", "18K", "14K"]).nullable(),
  weightMinG: z.number().positive().nullable(),
  weightMaxG: z.number().positive().nullable(),
  size: z.string().nullable(),
  stones: z.array(z.object({ label: z.string(), count: z.number().nullable() })),
  notes: z.string().nullable(),
  missing: z.array(z.string()),
});

export type Enquiry = z.infer<typeof enquirySchema>;

const ITEM_WORDS: [Enquiry["item"], RegExp][] = [
  ["earrings", /\b(earrings?|jhumk[ae]s?|jhumki|bali|balis|studs?|tops)\b|झुमके|झुमका|कान/i],
  ["necklace", /\b(necklace|haar|har|rani haar|choker)\b|हार|नेकलेस/i],
  ["chain", /\b(chain|chains|mangalsutra|mangal sutra|sakhli)\b|चेन|मंगळसूत्र|मंगलसूत्र/i],
  ["pendant", /\b(pendant|locket|ganpati|lakshmi)\b|पेंडेंट|लॉकेट/i],
  ["bangle", /\b(bangles?|bangdi|bangadi|choodi|churi|kada|kadaa|kangan)\b|बांगड्या|बांगडी|चूड़ी|चुडी|कड़ा|कडा/i],
  ["ring", /\b(rings?|anguthi|angoothi|angthi|band)\b|अंगूठी|अंगठी|अंगुठी/i],
];

const STONE_WORDS: [string, RegExp][] = [
  ["Diamond", /\b(diamonds?|heera|hira)\b|हीरा|हिरा/i],
  ["Ruby", /\b(ruby|manik)\b|माणिक|माणिक्य/i],
  ["Emerald", /\b(emerald|panna)\b|पन्ना/i],
  ["Pearl", /\b(pearls?|moti|motis)\b|मोती/i],
  ["Polki", /\bpolki\b|पोल्की/i],
  ["CZ", /\b(cz|zircon|american diamond|ad)\b/i],
];

// Number words used in the weight range: "15-18", "15 to 18", "15 se 18"
const NUM = String.raw`(\d+(?:\.\d+)?)`;
const UNIT = String.raw`(?:grams?|gms?|gm|gr|g|ग्राम|ग्रॅम)\b`;
const RANGE_RE = new RegExp(
  String.raw`${NUM}\s*(?:-|–|to|se|ते|से)\s*${NUM}\s*${UNIT}`,
  "iu",
);
const SINGLE_RE = new RegExp(String.raw`${NUM}\s*${UNIT}`, "iu");
const PURITY_RE = /\b(22|18|14)\s*(?:k|kt|karat|carat|ct)\b|\b(22|18|14)\s*(?:कैरेट|कॅरेट|कैरट)/iu;
const BARE_PURITY_RE = /\b(22|18|14)\b/;
const SIZE_RE = /\b(?:size|साइज|साईज|साइज़|नाप)\s*[:\-]?\s*(\d{1,2}(?:\.\d)?|[SML]|small|medium|large)\b/iu;
const LENGTH_RE = /\b(\d{2})\s*(?:inch(?:es)?|in|")\b/i;

export function parseEnquiry(text: string): Enquiry {
  const t = text.normalize("NFC");
  const missing: string[] = [];

  let item: Enquiry["item"] = null;
  for (const [name, re] of ITEM_WORDS) {
    if (re.test(t)) {
      item = name;
      break;
    }
  }
  if (!item) missing.push("item");

  let purity: Enquiry["purity"] = null;
  const pm = PURITY_RE.exec(t);
  if (pm) purity = `${pm[1] ?? pm[2]}K` as Enquiry["purity"];
  if (!purity) missing.push("purity");

  let weightMinG: number | null = null;
  let weightMaxG: number | null = null;
  const range = RANGE_RE.exec(t);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    weightMinG = Math.min(a, b);
    weightMaxG = Math.max(a, b);
  } else {
    const single = SINGLE_RE.exec(t);
    if (single) {
      weightMinG = Number(single[1]);
      weightMaxG = weightMinG;
    }
  }
  if (weightMinG === null) missing.push("weight");

  let size: string | null = null;
  const sm = SIZE_RE.exec(t);
  if (sm) {
    const raw = sm[1]!;
    size = { small: "S", medium: "M", large: "L" }[raw.toLowerCase() as string] ?? raw.toUpperCase();
  } else {
    const lm = LENGTH_RE.exec(t);
    if (lm) size = `${lm[1]} in`;
  }

  const stones: Enquiry["stones"] = [];
  for (const [label, re] of STONE_WORDS) {
    if (re.test(t)) stones.push({ label, count: null });
  }

  // A bare "18" with no unit stays ambiguous: it is never read as purity or weight.
  const bare = purity === null && BARE_PURITY_RE.test(t);
  const notes = bare ? 'The message has "18" (or 22 / 14) with no unit. Confirm purity and weight.' : null;

  return enquirySchema.parse({ item, purity, weightMinG, weightMaxG, size, stones, notes, missing });
}
