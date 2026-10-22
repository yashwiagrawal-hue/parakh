export type MakingBase = "gold" | "goldPlusWastage";

export interface PricingConfig {
  gstRate: number;
  makingBase: MakingBase;
}

export const DEFAULT_CONFIG: PricingConfig = {
  gstRate: 0.03,
  makingBase: "gold",
};

export const DEFAULT_MAX_IBJA_GAP = 0.1;
export const PER_10G_RATE_LIMIT = 30000;
export const IBJA_STALE_DAYS = 3;

function readNumber(value: string | undefined, fallback: number): number {
  const n = value === undefined || value === "" ? NaN : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Server-side config; reads GST_RATE and MAX_IBJA_GAP from the environment. */
export function serverConfig(): { pricing: PricingConfig; maxIbjaGap: number } {
  return {
    pricing: {
      ...DEFAULT_CONFIG,
      gstRate: readNumber(process.env.GST_RATE, DEFAULT_CONFIG.gstRate),
    },
    maxIbjaGap: readNumber(process.env.MAX_IBJA_GAP, DEFAULT_MAX_IBJA_GAP),
  };
}
