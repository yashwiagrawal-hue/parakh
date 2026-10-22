import { describe, expect, it } from "vitest";
import { checkRates } from "./checks";
import { formatDiff, formatINR, formatTotal } from "./format";
import {
  advanceAmount,
  computeQuote,
  derivedRates,
  lockExpiry,
  priceAt,
  validateSpec,
  type PriceInput,
} from "./pricing";

const board: PriceInput = {
  ratePer10g: 134300,
  weightMin: 5,
  weightMax: 5,
  makingPct: 9,
  wastagePct: 0,
  stones: 4000,
  gstPct: 3,
};

describe("pricing", () => {
  it("matches the concept board (5 g, ₹1,34,300/10g, 9% making, ₹4,000 stones)", () => {
    const l = priceAt(5, board);
    expect(l.gold).toBe(67150);
    expect(l.making).toBe(6044);
    expect(l.wastage).toBe(0);
    expect(l.stones).toBe(4000);
    expect(l.gst).toBe(2316);
    expect(l.total).toBe(79510);
    expect(formatINR(l.total)).toBe("₹79,510");
  });

  it("shows a single estimate when min = max", () => {
    const r = computeQuote(board);
    expect(r.single).toBe(true);
    expect(formatTotal(r)).toBe("₹79,510");
  });

  it("shows a range when min ≠ max", () => {
    const r = computeQuote({ ...board, weightMin: 4, weightMax: 6 });
    expect(r.single).toBe(false);
    expect(r.min.total).toBeLessThan(r.max.total);
    expect(formatTotal(r)).toBe(`${formatINR(r.min.total)} – ${formatINR(r.max.total)}`);
  });

  it("charges wastage on gold cost", () => {
    const l = priceAt(10, { ...board, wastagePct: 2 });
    expect(l.gold).toBe(134300);
    expect(l.wastage).toBe(2686);
    expect(l.subtotal).toBe(l.gold + l.making + l.wastage + l.stones);
  });

  it("rounds every line to whole rupees and the total is the sum of the lines", () => {
    const l = priceAt(3.37, { ...board, ratePer10g: 133333, makingPct: 11.5, wastagePct: 1.25, stones: 999.6 });
    for (const v of [l.gold, l.making, l.wastage, l.stones, l.gst, l.total]) expect(Number.isInteger(v)).toBe(true);
    expect(l.total).toBe(l.gold + l.making + l.wastage + l.stones + l.gst);
  });

  it("derives 24K and 18K from 22K by purity ratio", () => {
    expect(derivedRates(134300)).toEqual({ rate24k: 146509, rate18k: 109882 });
  });

  it("computes the advance and lock expiry", () => {
    expect(advanceAmount(79510, 25)).toBe(19878);
    expect(lockExpiry("2026-10-22T05:00:00.000Z", 7)).toBe("2026-10-29T05:00:00.000Z");
  });

  it("formats the IBJA difference", () => {
    expect(formatDiff(134300, 134200)).toBe("+₹100");
    expect(formatDiff(134100, 134200)).toBe("−₹100");
    expect(formatDiff(134200, 134200)).toBe("same as IBJA");
    expect(formatINR(134300)).toBe("₹1,34,300");
  });

  it("validates the design step", () => {
    expect(validateSpec({ weightMin: 4, weightMax: 6, makingPct: 9, wastagePct: 0, stones: 0 })).toEqual({});
    expect(validateSpec({ weightMin: 6, weightMax: 4, makingPct: 9, wastagePct: 0, stones: 0 }).weight).toBeDefined();
    expect(validateSpec({ weightMin: 0, weightMax: 4, makingPct: 9, wastagePct: 0, stones: 0 }).weight).toBeDefined();
    expect(validateSpec({ weightMin: 4, weightMax: 6, makingPct: 0, wastagePct: 0, stones: 0 }).making).toBeDefined();
    expect(validateSpec({ weightMin: 4, weightMax: 6, makingPct: 9, wastagePct: -1, stones: 0 }).wastage).toBeDefined();
  });
});

describe("rate sanity checks (per 10 g)", () => {
  const ok = { ratePer10g: 134300, ibjaPer10g: 134200 };

  it("passes a normal rate", () => {
    expect(checkRates(ok)).toEqual({ errors: [], warnings: [] });
  });

  it("blocks a per-gram rate entered as per 10 g", () => {
    expect(checkRates({ ratePer10g: 13430, ibjaPer10g: 134200 }).errors).toEqual([
      "This looks like a per-gram rate. Enter the rate per 10 g.",
    ]);
  });

  it("blocks a rate more than 10% from IBJA", () => {
    expect(checkRates({ ratePer10g: 150000, ibjaPer10g: 134200 }).errors[0]).toBe(
      "Today's rate is 11.8% above IBJA. Check it before quoting.",
    );
  });

  it("warns when rates are older than 3 days", () => {
    const r = checkRates({ ...ok, rateUpdatedAt: "2026-10-17T00:00:00Z", now: new Date("2026-10-22T00:00:00Z") });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toHaveLength(1);
  });
});
