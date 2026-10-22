import type { PriceRange } from "./pricing";

export type Purity = "24K" | "22K" | "18K";
export const PURITIES: Purity[] = ["22K", "24K", "18K"];

export const CATEGORIES = [
  "Ring",
  "Necklace",
  "Earrings",
  "Bracelet",
  "Pendant",
  "Bangle",
  "Chain",
  "Custom/Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type QuoteStatus = "Draft" | "Sent" | "Viewed" | "Advance Paid" | "Expired";

export interface Jeweller {
  id: string;
  name: string;
  phone: string;
  logoInitials: string;
  /** All rates are rupees per 10 g. */
  rate22k: number;
  rate24k: number;
  rate18k: number;
  ibjaRate22k: number;
  rateUpdatedAt: string; // ISO
  defaultMakingPct: number;
  defaultWastagePct: number;
  defaultGstPct: number;
  rateLockDays: number;
  rateLockAdvancePct: number;
}

export interface Design {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
  typicalWeightMin: number;
  typicalWeightMax: number;
}

export interface Quote {
  id: string;
  slug: string;
  jewellerId: string;
  jewellerName: string;
  jewellerPhone: string;
  customerName: string | null;
  customerPhone: string | null;
  enquiryText: string | null;
  referencePhotoUrl: string | null;
  designId: string | null;
  designName: string;
  designImageUrl: string | null;
  category: Category;
  purity: Purity;
  weightMin: number;
  weightMax: number;
  makingPct: number;
  wastagePct: number;
  stones: number;
  gstPct: number;
  /** Snapshotted at creation (rupees per 10 g) so later rate changes never alter a sent quote. */
  rateUsed: number;
  ibjaRateUsed: number;
  breakdown: PriceRange;
  rateLockDays: number;
  rateLockAdvancePct: number;
  advanceAmount: number;
  status: QuoteStatus;
  rateLockExpiresAt: string;
  createdAt: string;
  viewedAt: string | null;
}

/** A Sent or Viewed quote whose rate lock has passed counts as Expired. */
export function effectiveStatus(q: Pick<Quote, "status" | "rateLockExpiresAt">, now = new Date()): QuoteStatus {
  if ((q.status === "Sent" || q.status === "Viewed") && new Date(q.rateLockExpiresAt) < now) return "Expired";
  return q.status;
}
