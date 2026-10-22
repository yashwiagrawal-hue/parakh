import { formatTotal, formatWeightRange } from "./format";
import type { PriceRange } from "./pricing";

/** wa.me wants digits only with the country code. A bare 10-digit Indian mobile gets 91 in front. */
export function waPhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

export function whatsappUrl(phone: string | null | undefined, message: string): string {
  const p = waPhone(phone);
  return `https://wa.me/${p ?? ""}?text=${encodeURIComponent(message)}`;
}

export function quoteMessage(q: {
  customerName: string | null;
  jewellerName: string;
  designName: string;
  purity: string;
  weightMin: number;
  weightMax: number;
  breakdown: PriceRange;
  rateLockDays: number;
  rateLockAdvancePct: number;
  url: string;
}): string {
  const first = q.customerName?.trim().split(/\s+/)[0];
  return [
    `Hi${first ? ` ${first}` : ""}! Here is your quote from ${q.jewellerName} 🙏`,
    ``,
    `${q.designName} · ${q.purity} gold · ${formatWeightRange(q.weightMin, q.weightMax)}`,
    `Total estimate: ${formatTotal(q.breakdown)} (incl. GST)`,
    `Rate locked for ${q.rateLockDays} days on ${q.rateLockAdvancePct}% advance.`,
    ``,
    `Full price breakdown and IBJA comparison: ${q.url}`,
  ].join("\n");
}
