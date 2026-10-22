import { describe, expect, it } from "vitest";
import {
  computeQuote,
  formatGap,
  formatPaise,
  lockEndsAt,
  priceAtWeight,
  type PricingInput,
} from "./pricing";
import { checkRates } from "./checks";

const base: PricingInput = {
  weightMinG: 18,
  weightMaxG: 18,
  purity: "22K",
  ratePerG: 13430,
  ibjaRatePerG: 13430,
  making: { type: "percent", value: 0.12 },
  wastagePct: 0.08,
  stones: [],
  lockDays: 7,
  lockTable: { 7: 0.25, 15: 0.4, 30: 0.6 },
};

describe("pricing engine", () => {
  it("matches the required example (18 g, 22K, 13,430/g)", () => {
    const line = priceAtWeight(18, base);
    expect(line.goldValue).toBe(24174000);
    expect(line.wastage).toBe(1933920);
    expect(line.making).toBe(2900880);
    expect(line.subtotal).toBe(29008800);
    expect(line.gst).toBe(870264);
    expect(line.total).toBe(29879064);
    expect(line.perGram).toBe(1659948);
    expect(formatPaise(line.total)).toBe("₹2,98,791");
  });

  it("supports per-gram making", () => {
    const line = priceAtWeight(10, { ...base, making: { type: "perGram", value: 800 } });
    expect(line.making).toBe(800000);
  });

  it("supports flat making", () => {
    const line = priceAtWeight(10, { ...base, making: { type: "flat", value: 5000 } });
    expect(line.making).toBe(500000);
  });

  it("adds stones before GST", () => {
    const line = priceAtWeight(5, {
      ...base,
      stones: [
        { label: "Pearl", priceRupees: 2200 },
        { label: "CZ", priceRupees: 800.5 },
      ],
    });
    expect(line.stones).toBe(300050);
    expect(line.subtotal).toBe(line.goldValue + line.wastage + line.making + 300050);
    expect(line.gst).toBe(Math.round(line.subtotal * 0.03));
  });

  it("can charge making on gold plus wastage when configured", () => {
    const line = priceAtWeight(18, base, { gstRate: 0.03, makingBase: "goldPlusWastage" });
    expect(line.making).toBe(Math.round((24174000 + 1933920) * 0.12));
  });

  it("prices min and max weight separately", () => {
    const r = computeQuote({ ...base, weightMinG: 14, weightMaxG: 16 });
    expect(r.min.weightG).toBe(14);
    expect(r.max.weightG).toBe(16);
    expect(r.max.total).toBeGreaterThan(r.min.total);
    expect(r.min.total).toBe(priceAtWeight(14, base).total);
    // per-gram stays about the same when there are no stones or flat charges
    expect(Math.abs(r.max.perGram - r.min.perGram)).toBeLessThanOrEqual(1);
  });

  it("uses the same price at min and max when weight is confirmed", () => {
    const r = computeQuote(base);
    expect(r.min.total).toBe(r.max.total);
  });

  it.each([
    [7, 0.25],
    [15, 0.4],
    [30, 0.6],
  ])("computes the advance for a %i-day lock", (days, share) => {
    const r = computeQuote({ ...base, lockDays: days });
    expect(r.advanceShare).toBe(share);
    expect(r.advance).toBe(Math.round(29879064 * share));
  });

  it("has no advance when the lock length is not in the table", () => {
    expect(computeQuote({ ...base, lockDays: 9 }).advance).toBe(0);
  });

  it("calculates the IBJA gap", () => {
    const r = computeQuote({ ...base, ratePerG: 13700, ibjaRatePerG: 13430 });
    expect(r.ibjaGapPct).toBeCloseTo(0.0201, 3);
    expect(formatGap(r.ibjaGapPct)).toBe("2.0% above IBJA");
    expect(formatGap(-0.0123)).toBe("1.2% below IBJA");
    expect(formatGap(0)).toBe("Same as IBJA");
  });

  it("keeps money as integers and rounds to whole rupees only for display", () => {
    const line = priceAtWeight(3.8, { ...base, ratePerG: 13433.33 });
    for (const v of [line.goldValue, line.wastage, line.making, line.gst, line.total, line.perGram]) {
      expect(Number.isInteger(v)).toBe(true);
    }
    expect(formatPaise(29879064)).toBe("₹2,98,791");
    expect(formatPaise(29879049)).toBe("₹2,98,790");
  });

  it("adds lock days to the approval date", () => {
    expect(lockEndsAt("2026-10-22T10:00:00.000Z", 15)).toBe("2026-11-06T10:00:00.000Z");
  });
});

describe("rate sanity checks", () => {
  const ok = { ratePerG: 13430, ibjaRatePerG: 13300, ibjaDate: "2026-10-22", today: "2026-10-22" };

  it("passes a normal rate", () => {
    expect(checkRates(ok)).toEqual({ errors: [], warnings: [] });
  });

  it("blocks a rate more than 10% from IBJA", () => {
    const r = checkRates({ ...ok, ratePerG: 15000 });
    expect(r.errors).toEqual(["Today's rate is 12.8% above IBJA. Check it before quoting."]);
  });

  it("honours a custom maximum gap", () => {
    expect(checkRates({ ...ok, ratePerG: 13700, maxIbjaGap: 0.02 }).errors).toHaveLength(1);
  });

  it("blocks a per-10 g rate", () => {
    const r = checkRates({ ...ok, ratePerG: 134300, ibjaRatePerG: 133000 });
    expect(r.errors).toEqual(["This looks like a per-10 g rate. Enter the rate per gram."]);
  });

  it("warns when the IBJA date is older than 3 days", () => {
    const r = checkRates({ ...ok, ibjaDate: "2026-10-18" });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toHaveLength(1);
    expect(checkRates({ ...ok, ibjaDate: "2026-10-19" }).warnings).toEqual([]);
  });

  it("blocks missing rates", () => {
    expect(checkRates({ ...ok, ratePerG: 0 }).errors).toHaveLength(1);
  });
});
