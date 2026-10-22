import { z } from "zod";
import type { PriceRange, PricingInput } from "./pricing";

const purity = z.enum(["22K", "18K", "14K"]);

const making = z.discriminatedUnion("type", [
  z.object({ type: z.literal("percent"), value: z.number().min(0).max(1) }),
  z.object({ type: z.literal("perGram"), value: z.number().min(0).max(100000) }),
  z.object({ type: z.literal("flat"), value: z.number().min(0).max(100000000) }),
]);

/** What the jeweller's screen sends when they press "Approve and create link". */
export const quoteRequestSchema = z
  .object({
    designId: z.string().max(60).nullable(),
    item: z.string().max(30).nullable().optional(),
    sizeLabel: z.string().max(30).nullable(),
    purity,
    weightMinG: z.number().positive().max(5000),
    weightMaxG: z.number().positive().max(5000),
    ratePerG: z.number().positive(),
    ibjaRatePerG: z.number().positive(),
    ibjaDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ibjaSession: z.enum(["AM", "PM"]),
    making,
    wastagePct: z.number().min(0).max(1),
    stones: z
      .array(z.object({ label: z.string().min(1).max(60), priceRupees: z.number().min(0).max(100000000) }))
      .max(10),
    lockDays: z.number().int().positive(),
    customerFirstName: z.string().max(40).nullable().optional(),
    supersedes: z.string().length(12).nullable().optional(),
  })
  .refine((q) => q.weightMaxG >= q.weightMinG, { message: "Maximum weight must not be below minimum weight." });

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export type QuoteStatus = "draft" | "approved";

export interface QuoteRecord {
  id: string;
  status: QuoteStatus;
  createdAt: string;
  approvedAt: string;
  lockEndsAt: string;
  supersedes: string | null;
  customerFirstName: string | null;
  designName: string;
  designImage: string | null;
  item: string | null;
  sizeLabel: string | null;
  demoWeights: boolean;
  ibjaDate: string;
  ibjaSession: "AM" | "PM";
  warnings: string[];
  jeweller: { shopName: string; area: string; contact: string };
  input: PricingInput;
  gstRate: number;
  result: PriceRange;
}

/** First name only; never part of the URL. */
export function cleanFirstName(value: string | null | undefined): string | null {
  const first = (value ?? "").trim().split(/\s+/)[0] ?? "";
  return first ? first.slice(0, 30) : null;
}
