import { DEFAULT_CONFIG, type PricingConfig } from "./config";

export type Purity = "22K" | "18K" | "14K";
export const PURITIES: Purity[] = ["22K", "18K", "14K"];

export type Making =
  | { type: "percent"; value: number } // value is a fraction, 0.12 = 12%
  | { type: "perGram"; value: number } // rupees per gram
  | { type: "flat"; value: number }; // rupees

export interface Stone {
  label: string;
  priceRupees: number;
}

/** days -> advance share (0.25 = 25%) */
export type LockTable = Record<number, number>;

export interface PricingInput {
  weightMinG: number;
  weightMaxG: number;
  purity: Purity;
  ratePerG: number; // rupees per gram
  ibjaRatePerG: number; // rupees per gram
  making: Making;
  wastagePct: number; // fraction, 0.08 = 8%
  stones: Stone[];
  lockDays: number;
  lockTable: LockTable;
}

/** All money below is integer paise. */
export interface PriceLine {
  weightG: number;
  goldValue: number;
  wastage: number;
  making: number;
  stones: number;
  subtotal: number;
  gst: number;
  total: number;
  perGram: number; // all-in price per gram
}

export interface PriceRange {
  min: PriceLine;
  max: PriceLine;
  ibjaGapPct: number; // fraction, 0.021 = 2.1% above IBJA
  advance: number; // paise, based on the maximum total
  advanceShare: number;
}

const toPaise = (rupees: number): number => Math.round(rupees * 100);

export function priceAtWeight(
  weightG: number,
  input: PricingInput,
  config: PricingConfig = DEFAULT_CONFIG,
): PriceLine {
  const ratePaise = toPaise(input.ratePerG);
  const goldValue = Math.round(weightG * ratePaise);
  const wastage = Math.round(goldValue * input.wastagePct);
  const makingBase = config.makingBase === "goldPlusWastage" ? goldValue + wastage : goldValue;

  let making: number;
  switch (input.making.type) {
    case "percent":
      making = Math.round(makingBase * input.making.value);
      break;
    case "perGram":
      making = Math.round(weightG * toPaise(input.making.value));
      break;
    case "flat":
      making = toPaise(input.making.value);
      break;
  }

  const stones = input.stones.reduce((sum, s) => sum + toPaise(s.priceRupees), 0);
  const subtotal = goldValue + wastage + making + stones;
  const gst = Math.round(subtotal * config.gstRate);
  const total = subtotal + gst;
  const perGram = weightG > 0 ? Math.round(total / weightG) : 0;

  return { weightG, goldValue, wastage, making, stones, subtotal, gst, total, perGram };
}

export function ibjaGapPct(ratePerG: number, ibjaRatePerG: number): number {
  return (ratePerG - ibjaRatePerG) / ibjaRatePerG;
}

export function computeQuote(
  input: PricingInput,
  config: PricingConfig = DEFAULT_CONFIG,
): PriceRange {
  const min = priceAtWeight(input.weightMinG, input, config);
  const max = priceAtWeight(input.weightMaxG, input, config);
  const advanceShare = input.lockTable[input.lockDays] ?? 0;
  return {
    min,
    max,
    ibjaGapPct: ibjaGapPct(input.ratePerG, input.ibjaRatePerG),
    advance: Math.round(max.total * advanceShare),
    advanceShare,
  };
}

/** lockEndsAt = approvedAt + lockDays (ISO string in, ISO string out). */
export function lockEndsAt(approvedAt: string, lockDays: number): string {
  const d = new Date(approvedAt);
  d.setUTCDate(d.getUTCDate() + lockDays);
  return d.toISOString();
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Round to whole rupees for display only. */
export function formatPaise(paise: number): string {
  return inr.format(Math.round(paise / 100));
}

export function formatRupees(rupees: number): string {
  return inr.format(Math.round(rupees));
}

/** Per-gram range, lowest first. Stones and flat making make the lighter piece dearer per gram. */
export function perGramRange(r: PriceRange): [number, number] {
  return [Math.min(r.min.perGram, r.max.perGram), Math.max(r.min.perGram, r.max.perGram)];
}

export function formatGap(gap: number): string {
  const pct = Math.abs(gap * 100);
  const text = pct.toFixed(1);
  if (Number(text) === 0) return "Same as IBJA";
  return `${text}% ${gap > 0 ? "above" : "below"} IBJA`;
}
