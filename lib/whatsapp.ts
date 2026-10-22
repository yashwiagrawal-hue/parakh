import { formatPaise } from "./pricing";
import type { QuoteRecord } from "./quote";

const weight = (g: number) => String(Math.round(g * 100) / 100);

/** Short message for the jeweller to paste into WhatsApp. All numbers come from the stored quote. */
export function whatsappMessage(q: QuoteRecord, url: string): string {
  const { result, input } = q;
  const range =
    input.weightMinG === input.weightMaxG
      ? `${weight(input.weightMinG)} g`
      : `${weight(input.weightMinG)} to ${weight(input.weightMaxG)} g`;
  const price =
    result.min.total === result.max.total
      ? formatPaise(result.max.total)
      : `${formatPaise(result.min.total)} to ${formatPaise(result.max.total)}`;
  const size = q.sizeLabel ? `, size ${q.sizeLabel}` : "";
  const hello = q.customerFirstName ? `Hi ${q.customerFirstName}, ` : "Hi, ";
  const lines = [
    `${hello}your quote from ${q.jeweller.shopName}:`,
    `${q.designName}, ${input.purity}${size}`,
    `Weight: ${range}`,
    `Price: ${price} (includes ${Math.round(q.gstRate * 100)}% GST)`,
    `Rate locked for ${input.lockDays} days. Full breakup and terms:`,
    url,
  ];
  return lines.join("\n");
}
