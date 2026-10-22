export const MAX_IBJA_GAP_DEFAULT = 0.1;
/** Below this, a "per 10 g" rate is almost certainly a per-gram rate. */
export const MIN_PER_10G_RATE = 30000;
export const IBJA_STALE_DAYS = 3;

export interface RateCheckResult {
  /** Problems that block saving. */
  errors: string[];
  /** Notes that do not block but must be visible. */
  warnings: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Sanity checks on the 22K rate and IBJA benchmark, both in rupees per 10 g. */
export function checkRates(input: {
  ratePer10g: number;
  ibjaPer10g: number;
  rateUpdatedAt?: string;
  now?: Date;
  maxGap?: number;
}): RateCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { ratePer10g, ibjaPer10g } = input;

  if (!(ratePer10g > 0) || !(ibjaPer10g > 0)) {
    errors.push("Enter both your rate and the IBJA rate per 10 g.");
    return { errors, warnings };
  }
  if (ratePer10g < MIN_PER_10G_RATE || ibjaPer10g < MIN_PER_10G_RATE) {
    errors.push("This looks like a per-gram rate. Enter the rate per 10 g.");
    return { errors, warnings };
  }

  const gap = (ratePer10g - ibjaPer10g) / ibjaPer10g;
  if (Math.abs(gap) > (input.maxGap ?? MAX_IBJA_GAP_DEFAULT)) {
    errors.push(
      `Today's rate is ${(Math.abs(gap) * 100).toFixed(1)}% ${gap > 0 ? "above" : "below"} IBJA. Check it before quoting.`,
    );
  }

  if (input.rateUpdatedAt) {
    const age = Math.floor(((input.now ?? new Date()).getTime() - Date.parse(input.rateUpdatedAt)) / DAY_MS);
    if (age > IBJA_STALE_DAYS) warnings.push(`Rates were last updated ${age} days ago. Update them before quoting.`);
  }
  return { errors, warnings };
}

export function maxIbjaGap(): number {
  const n = Number(process.env.MAX_IBJA_GAP);
  return Number.isFinite(n) && n > 0 ? n : MAX_IBJA_GAP_DEFAULT;
}
