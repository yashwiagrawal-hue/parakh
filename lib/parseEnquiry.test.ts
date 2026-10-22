import { describe, expect, it } from "vitest";
import { parseEnquiry, widenWeight } from "./parseEnquiry";

describe("parseEnquiry", () => {
  it("reads the concept-board example", () => {
    const r = parseEnquiry("Hi, I want a 5 gram ring with a floral design in 22K gold. Please Share the Quotation.");
    expect(r).toEqual({ category: "Ring", purity: "22K", weightMin: 4, weightMax: 6, missing: [] });
  });

  it.each([
    ["5g ring", 5],
    ["5 gms chain", 5],
    ["7.5 gm pendant", 7.5],
    ["10 grams bangle", 10],
  ])("reads the weight in %s", (text, w) => {
    const r = parseEnquiry(text);
    expect(r.weightMin).toBe(Math.max(0.5, w - 1));
    expect(r.weightMax).toBe(w + 1);
  });

  it("keeps an explicit range as typed", () => {
    const r = parseEnquiry("necklace around 30-35 gm in 22 carat");
    expect(r.category).toBe("Necklace");
    expect(r.purity).toBe("22K");
    expect(r.weightMin).toBe(30);
    expect(r.weightMax).toBe(35);
  });

  it.each([
    ["24K coin pendant", "24K"],
    ["18 kt bracelet", "18K"],
    ["22 carat earrings", "22K"],
  ])("reads purity in %s", (text, purity) => {
    expect(parseEnquiry(text).purity).toBe(purity);
  });

  it.each([
    ["need earrings", "Earrings"],
    ["gold bracelet please", "Bracelet"],
    ["bangles for wedding", "Bangle"],
    ["a chain", "Chain"],
    ["Lakshmi pendant", "Pendant"],
  ])("reads the category in %s", (text, category) => {
    expect(parseEnquiry(text).category).toBe(category);
  });

  it("never guesses: a bare number is not a weight or purity", () => {
    const r = parseEnquiry("need ring 18");
    expect(r.purity).toBeNull();
    expect(r.weightMin).toBeNull();
    expect(r.missing).toEqual(["purity", "weight"]);
  });

  it("does not read purity digits as a weight", () => {
    expect(parseEnquiry("22k necklace").weightMin).toBeNull();
  });

  it("keeps the minimum widened weight at 0.5 g", () => {
    expect(widenWeight(1)).toEqual({ weightMin: 0.5, weightMax: 2 });
  });
});
