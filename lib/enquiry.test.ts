import { describe, expect, it } from "vitest";
import { parseEnquiry } from "./enquiry";

describe("parseEnquiry", () => {
  it("reads a clear English enquiry", () => {
    const r = parseEnquiry("Hi, need a 22k bangle around 15-18 gm, size 2.4");
    expect(r.item).toBe("bangle");
    expect(r.purity).toBe("22K");
    expect(r.weightMinG).toBe(15);
    expect(r.weightMaxG).toBe(18);
    expect(r.size).toBe("2.4");
    expect(r.missing).toEqual([]);
  });

  it("reads Hinglish and Devanagari", () => {
    const r = parseEnquiry("mujhe ek anguthi chahiye 18 kt, 4 gram, heera wali");
    expect(r.item).toBe("ring");
    expect(r.purity).toBe("18K");
    expect(r.weightMinG).toBe(4);
    expect(r.weightMaxG).toBe(4);
    expect(r.stones).toEqual([{ label: "Diamond", count: null }]);
    expect(parseEnquiry("22 कैरेट की अंगूठी 5 ग्राम").purity).toBe("22K");
  });

  it("never guesses: a bare 18 is ambiguous and goes in missing", () => {
    const r = parseEnquiry("need chain 18");
    expect(r.purity).toBeNull();
    expect(r.weightMinG).toBeNull();
    expect(r.missing).toEqual(expect.arrayContaining(["purity", "weight"]));
    expect(r.notes).toContain("no unit");
  });

  it("returns nulls for an empty message", () => {
    const r = parseEnquiry("hello");
    expect(r.item).toBeNull();
    expect(r.missing).toEqual(["item", "purity", "weight"]);
  });

  it("does not read purity digits as weight", () => {
    const r = parseEnquiry("22k necklace");
    expect(r.weightMinG).toBeNull();
    expect(r.missing).toContain("weight");
  });
});
