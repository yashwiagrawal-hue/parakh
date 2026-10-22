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

/**
 * Demo catalogue, as on the concept board: four designs plus the Custom / Other tile.
 * Photos in public/photos are cropped from the owner's own concept board; replace them with the jeweller's photos.
 * Pendant, bangle and chain enquiries go through Custom / Other. Weights are placeholders.
 */
export const DESIGNS: Design[] = [
  { id: "ring", name: "Ring", category: "Ring", imageUrl: "/photos/floral-ring.jpg", thumbUrl: "/photos/ring.jpg", typicalWeightMin: 4, typicalWeightMax: 6 },
  { id: "necklace", name: "Necklace", category: "Necklace", imageUrl: "/photos/necklace.jpg", thumbUrl: "/photos/necklace.jpg", typicalWeightMin: 28, typicalWeightMax: 36 },
  { id: "earrings", name: "Earrings", category: "Earrings", imageUrl: "/photos/earrings.jpg", thumbUrl: "/photos/earrings.jpg", typicalWeightMin: 5, typicalWeightMax: 8 },
  { id: "bracelet", name: "Bracelet", category: "Bracelet", imageUrl: "/photos/bracelet.jpg", thumbUrl: "/photos/bracelet.jpg", typicalWeightMin: 10, typicalWeightMax: 14 },
];

export function findDesign(id: string | null | undefined): Design | undefined {
  return DESIGNS.find((d) => d.id === id);
}

/** The four recent quotes from the concept board. Totals are recalculated, never copied. */
export const SEED_QUOTES = [
  { customerName: "Riya Shah", designId: "ring", designName: "Custom Ring", category: "Ring", weight: 8.5, stones: 4000, status: "Sent", createdAt: "2026-10-21T06:30:00.000Z" },
  { customerName: "Amit Mehta", designId: "necklace", designName: "Bridal Necklace", category: "Necklace", weight: 32, stones: 0, status: "Viewed", createdAt: "2026-10-20T08:00:00.000Z" },
  { customerName: "Pooja Nair", designId: "earrings", designName: "Gold Earrings", category: "Earrings", weight: 6.2, stones: 0, status: "Advance Paid", createdAt: "2026-10-19T10:15:00.000Z" },
  { customerName: "Karan B.", designId: "bracelet", designName: "Bracelet", category: "Bracelet", weight: 12, stones: 0, status: "Sent", createdAt: "2026-10-18T11:45:00.000Z" },
] as const;
