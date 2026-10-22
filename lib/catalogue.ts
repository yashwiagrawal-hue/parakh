import catalogueJson from "@/data/catalogue.json";
import jewellerJson from "@/data/jeweller.json";
import type { LockTable, Purity } from "./pricing";

export type ItemType =
  | "ring"
  | "bangle"
  | "chain"
  | "necklace"
  | "earrings"
  | "pendant"
  | "other";

export interface DesignSize {
  label: string;
  weightMinG: number;
  weightMaxG: number;
}

export interface Design {
  id: string;
  name: string;
  item: ItemType;
  image: string;
  demo: boolean;
  defaultMakingPct: number;
  defaultWastagePct: number;
  defaultStones: { label: string; priceRupees: number }[];
  sizeLabel: string;
  sizes: Record<Purity, DesignSize[]>;
}

export interface Jeweller {
  shopName: string;
  area: string;
  contact: string;
  demo: boolean;
  lockTable: LockTable;
  defaultLockDays: number;
  defaultRates: Record<Purity, number>;
  defaultIbjaRates: Record<Purity, number>;
}

export const designs = catalogueJson as unknown as Design[];
export const jeweller = jewellerJson as unknown as Jeweller;

export function findDesign(id: string): Design | undefined {
  return designs.find((d) => d.id === id);
}

export function findSize(design: Design, purity: Purity, label: string): DesignSize | undefined {
  return design.sizes[purity]?.find((s) => s.label === label);
}
