/**
 * Pricing engine. Pure functions, no I/O. AI never calculates money: every number on a quote comes from here.
 * Rates are rupees per 10 g. Each line is rounded to the nearest rupee, and totals are sums of the
 * rounded lines so the breakdown always adds up.
 */

export interface PriceInput {
  ratePer10g: number;
  weightMin: number;
  weightMax: number;
  makingPct: number; // 9 = 9%
  wastagePct: number;
  stones: number; // rupees
  gstPct: number; // 3 = 3%
}

export interface PriceLines {
  weight: number;
  gold: number;
  making: number;
  wastage: number;
  stones: number;
  subtotal: number;
  gst: number;
  total: number;
}

export interface PriceRange {
  min: PriceLines;
  max: PriceLines;
  /** True when min weight = max weight, so the quote shows a single estimate. */
  single: boolean;
}

export const DEFAULT_GST_PCT = 3;

export function priceAt(weight: number, input: PriceInput): PriceLines {
  const gold = Math.round((input.ratePer10g / 10) * weight);
  const making = Math.round(gold * (input.makingPct / 100));
  const wastage = Math.round(gold * (input.wastagePct / 100));
  const stones = Math.round(input.stones);
  const subtotal = gold + making + wastage + stones;
  const gst = Math.round(subtotal * (input.gstPct / 100));
  return { weight, gold, making, wastage, stones, subtotal, gst, total: subtotal + gst };
}

export function computeQuote(input: PriceInput): PriceRange {
  return {
    min: priceAt(input.weightMin, input),
    max: priceAt(input.weightMax, input),
    single: input.weightMin === input.weightMax,
  };
}

/** 24K and 18K derived from the 22K rate by purity ratio (rupees per 10 g, rounded). */
export function derivedRates(rate22k: number): { rate24k: number; rate18k: number } {
  return { rate24k: Math.round((rate22k * 24) / 22), rate18k: Math.round((rate22k * 18) / 22) };
}

export function advanceAmount(totalMax: number, advancePct: number): number {
  return Math.round(totalMax * (advancePct / 100));
}

export function lockExpiry(createdAtIso: string, days: number): string {
  const d = new Date(createdAtIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export interface InputErrors {
  weight?: string;
  making?: string;
  wastage?: string;
  stones?: string;
}

/** Validation for the design step: min <= max and values in range. */
export function validateSpec(s: {
  weightMin: number;
  weightMax: number;
  makingPct: number;
  wastagePct: number;
  stones: number;
}): InputErrors {
  const e: InputErrors = {};
  if (!(s.weightMin > 0) || !(s.weightMax > 0)) e.weight = "Enter both weights in grams, more than 0.";
  else if (s.weightMin > s.weightMax) e.weight = "The minimum weight must not be more than the maximum.";
  if (!(s.makingPct > 0) || s.makingPct > 100) e.making = "Enter making charges between 0 and 100%.";
  if (!(s.wastagePct >= 0) || s.wastagePct > 100) e.wastage = "Enter wastage between 0 and 100%.";
  if (!(s.stones >= 0)) e.stones = "Enter stone charges as 0 or more.";
  return e;
}
