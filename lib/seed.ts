import { derivedRates } from "./pricing";
import type { Design, Jeweller } from "./types";

/** The single demo jeweller, treated as the logged-in user until auth is added. */
export const SEED_JEWELLER: Jeweller = {
  id: "jw_shree",
  name: "Shree Jewellers",
  phone: "+91 98200 00000",
  logoInitials: "SJ",
  rate22k: 134300,
  ...derivedRates(134300),
  ibjaRate22k: 134200,
  rateUpdatedAt: "2026-10-22T03:30:00.000Z",
  defaultMakingPct: 9,
  defaultWastagePct: 0,
  defaultGstPct: 3,
  rateLockDays: 7,
  rateLockAdvancePct: 25,
};

/** Demo catalogue. Images are original SVG illustrations in public/designs. Weights are placeholders. */
export const DESIGNS: Design[] = [
  { id: "floral-ring", name: "Floral Ring", category: "Ring", imageUrl: "/designs/floral-ring.svg", typicalWeightMin: 4, typicalWeightMax: 6 },
  { id: "bridal-necklace", name: "Bridal Necklace", category: "Necklace", imageUrl: "/designs/necklace.svg", typicalWeightMin: 28, typicalWeightMax: 36 },
  { id: "flower-earrings", name: "Gold Earrings", category: "Earrings", imageUrl: "/designs/earrings.svg", typicalWeightMin: 5, typicalWeightMax: 8 },
  { id: "link-bracelet", name: "Bracelet", category: "Bracelet", imageUrl: "/designs/bracelet.svg", typicalWeightMin: 10, typicalWeightMax: 14 },
  { id: "lakshmi-pendant", name: "Lakshmi Pendant", category: "Pendant", imageUrl: "/designs/pendant.svg", typicalWeightMin: 4, typicalWeightMax: 7 },
  { id: "plain-bangle", name: "Plain Bangle", category: "Bangle", imageUrl: "/designs/bangle.svg", typicalWeightMin: 14, typicalWeightMax: 18 },
  { id: "rope-chain", name: "Rope Chain", category: "Chain", imageUrl: "/designs/chain.svg", typicalWeightMin: 10, typicalWeightMax: 16 },
  { id: "solitaire-ring", name: "Solitaire Ring", category: "Ring", imageUrl: "/designs/solitaire-ring.svg", typicalWeightMin: 3, typicalWeightMax: 5 },
];

export function findDesign(id: string | null | undefined): Design | undefined {
  return DESIGNS.find((d) => d.id === id);
}

/** The four recent quotes from the concept board. Totals are recalculated, never copied. */
export const SEED_QUOTES = [
  { customerName: "Riya Shah", designId: "floral-ring", designName: "Custom Ring", category: "Ring", weight: 8.5, stones: 4000, status: "Sent", createdAt: "2026-10-21T06:30:00.000Z" },
  { customerName: "Amit Mehta", designId: "bridal-necklace", designName: "Bridal Necklace", category: "Necklace", weight: 32, stones: 0, status: "Viewed", createdAt: "2026-10-20T08:00:00.000Z" },
  { customerName: "Pooja Nair", designId: "flower-earrings", designName: "Gold Earrings", category: "Earrings", weight: 6.2, stones: 0, status: "Advance Paid", createdAt: "2026-10-19T10:15:00.000Z" },
  { customerName: "Karan B.", designId: "link-bracelet", designName: "Bracelet", category: "Bracelet", weight: 12, stones: 0, status: "Sent", createdAt: "2026-10-18T11:45:00.000Z" },
] as const;
