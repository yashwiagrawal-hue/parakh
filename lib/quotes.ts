import { customAlphabet } from "nanoid";
import { z } from "zod";
import { advanceAmount, computeQuote, lockExpiry } from "./pricing";
import { findDesign } from "./seed";
import { CATEGORIES, type Jeweller, type Purity, type Quote, type QuoteStatus } from "./types";

/** Short public slug, e.g. "7h3kL2xQ". Random, so links can't be guessed; never contains personal data. */
export const newSlug = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 8);
export const SLUG_RE = /^[A-Za-z0-9]{6,12}$/;

export function rateFor(j: Jeweller, purity: Purity): number {
  return purity === "24K" ? j.rate24k : purity === "18K" ? j.rate18k : j.rate22k;
}

/** IBJA is entered for 22K; other purities use the same purity ratio as the shop rate. */
export function ibjaFor(j: Jeweller, purity: Purity): number {
  return purity === "24K"
    ? Math.round((j.ibjaRate22k * 24) / 22)
    : purity === "18K"
      ? Math.round((j.ibjaRate22k * 18) / 22)
      : j.ibjaRate22k;
}

/** What the wizard sends on "Confirm & Create Link". Money is always recomputed on the server. */
export const quoteDraftSchema = z
  .object({
    customerName: z.string().trim().max(60).nullable(),
    customerPhone: z
      .string()
      .trim()
      .max(20)
      .regex(/^[+\d\s()-]*$/, "Enter the phone number with digits only.")
      .nullable(),
    enquiryText: z.string().max(2000).nullable(),
    referencePhotoUrl: z.string().max(200).regex(/^\/api\/uploads\/[\w.-]+$/).nullable(),
    designId: z.string().max(60).nullable(),
    category: z.enum(CATEGORIES),
    purity: z.enum(["24K", "22K", "18K"]),
    weightMin: z.number().positive().max(2000),
    weightMax: z.number().positive().max(2000),
    makingPct: z.number().gt(0).max(100),
    wastagePct: z.number().min(0).max(100),
    stones: z.number().min(0).max(100000000),
  })
  .refine((d) => d.weightMin <= d.weightMax, { message: "The minimum weight must not be more than the maximum." });

export type QuoteDraft = z.infer<typeof quoteDraftSchema>;

export function buildQuote(
  draft: QuoteDraft,
  j: Jeweller,
  opts: { slug: string; createdAt: string; status?: QuoteStatus },
): Quote {
  const design = findDesign(draft.designId);
  const rateUsed = rateFor(j, draft.purity);
  const breakdown = computeQuote({
    ratePer10g: rateUsed,
    weightMin: draft.weightMin,
    weightMax: draft.weightMax,
    makingPct: draft.makingPct,
    wastagePct: draft.wastagePct,
    stones: draft.stones,
    gstPct: j.defaultGstPct,
  });
  return {
    id: `q_${opts.slug}`,
    slug: opts.slug,
    jewellerId: j.id,
    jewellerName: j.name,
    jewellerPhone: j.phone,
    customerName: draft.customerName || null,
    customerPhone: draft.customerPhone?.replace(/[^\d+]/g, "") || null,
    enquiryText: draft.enquiryText || null,
    referencePhotoUrl: draft.referencePhotoUrl,
    designId: design?.id ?? null,
    designName: pieceName(draft.category),
    designImageUrl: design?.imageUrl ?? null,
    category: draft.category,
    purity: draft.purity,
    weightMin: draft.weightMin,
    weightMax: draft.weightMax,
    makingPct: draft.makingPct,
    wastagePct: draft.wastagePct,
    stones: draft.stones,
    gstPct: j.defaultGstPct,
    rateUsed,
    ibjaRateUsed: ibjaFor(j, draft.purity),
    breakdown,
    rateLockDays: j.rateLockDays,
    rateLockAdvancePct: j.rateLockAdvancePct,
    advanceAmount: advanceAmount(breakdown.max.total, j.rateLockAdvancePct),
    status: opts.status ?? "Sent",
    rateLockExpiresAt: lockExpiry(opts.createdAt, j.rateLockDays),
    createdAt: opts.createdAt,
    viewedAt: null,
  };
}

/** "Custom Ring", as on the quote preview and customer view. */
export function pieceName(category: Quote["category"]): string {
  return category === "Custom/Other" ? "Custom Piece" : `Custom ${category}`;
}

/** "Your Custom Ring Quote" */
export function quoteTitle(q: Pick<Quote, "category">): string {
  return q.category === "Custom/Other" ? "Your Custom Jewellery Quote" : `Your Custom ${q.category} Quote`;
}
