import type { PriceRange } from "./pricing";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatINR(rupees: number): string {
  return inr.format(Math.round(rupees));
}

/** "₹X – ₹Y", or a single amount when the weight is confirmed. */
export function formatTotal(range: PriceRange): string {
  return range.single || range.min.total === range.max.total
    ? formatINR(range.max.total)
    : `${formatINR(range.min.total)} – ${formatINR(range.max.total)}`;
}

/** "₹X – ₹Y" for one line of the breakdown. */
export function formatLine(min: number, max: number): string {
  return min === max ? formatINR(max) : `${formatINR(min)} – ${formatINR(max)}`;
}

export function formatGrams(g: number): string {
  return `${Number.isInteger(g) ? g.toFixed(1) : String(Math.round(g * 100) / 100)} g`;
}

export function formatWeightRange(min: number, max: number): string {
  return min === max ? formatGrams(min) : `${formatGrams(min).replace(" g", "")} – ${formatGrams(max)}`;
}

/** Difference from IBJA, e.g. "+₹100" or "−₹50". */
export function formatDiff(rate: number, ibja: number): string {
  const d = Math.round(rate - ibja);
  if (d === 0) return "same as IBJA";
  return `${d > 0 ? "+" : "−"}${formatINR(Math.abs(d))}`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const longDateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatLongDate(iso: string): string {
  return longDateFmt.format(new Date(iso));
}
