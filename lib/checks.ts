import {
  DEFAULT_MAX_IBJA_GAP,
  IBJA_STALE_DAYS,
  PER_10G_RATE_LIMIT,
} from "./config";
import { ibjaGapPct } from "./pricing";

export interface RateCheckInput {
  ratePerG: number;
  ibjaRatePerG: number;
  ibjaDate: string; // YYYY-MM-DD
  today?: string; // YYYY-MM-DD, defaults to now
  maxIbjaGap?: number;
}

export interface RateCheckResult {
  /** Problems that block saving the quote. */
  errors: string[];
  /** Notes that do not block but must be visible. */
  warnings: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / DAY_MS);
}

export function checkRates(input: RateCheckInput): RateCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const maxGap = input.maxIbjaGap ?? DEFAULT_MAX_IBJA_GAP;
  const { ratePerG, ibjaRatePerG } = input;

  if (!(ratePerG > 0) || !(ibjaRatePerG > 0)) {
    errors.push("Enter both the shop rate and the IBJA rate per gram.");
    return { errors, warnings };
  }

  if (ratePerG > PER_10G_RATE_LIMIT || ibjaRatePerG > PER_10G_RATE_LIMIT) {
    errors.push("This looks like a per-10 g rate. Enter the rate per gram.");
    return { errors, warnings };
  }

  const gap = ibjaGapPct(ratePerG, ibjaRatePerG);
  if (Math.abs(gap) > maxGap) {
    const pct = (Math.abs(gap) * 100).toFixed(1);
    errors.push(
      `Today's rate is ${pct}% ${gap > 0 ? "above" : "below"} IBJA. Check it before quoting.`,
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.ibjaDate) || Number.isNaN(Date.parse(input.ibjaDate))) {
    errors.push("Enter the date of the IBJA rate.");
  } else {
    const today = input.today ?? new Date().toISOString().slice(0, 10);
    const age = dayNumber(today) - dayNumber(input.ibjaDate);
    if (age > IBJA_STALE_DAYS) {
      warnings.push(
        `The IBJA rate is from ${input.ibjaDate}, ${age} days ago. The date will be shown on the quote.`,
      );
    }
  }

  return { errors, warnings };
}
