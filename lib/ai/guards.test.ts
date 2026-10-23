import { describe, expect, it } from "vitest";
import { checkAgainstText, fillReply, type AiFields } from "./guards";

const base: AiFields = { category: null, purity: null, weightMin: null, weightMax: null, designNotes: null, language: null };

describe("AI reading is checked against the customer's message", () => {
  const text = "Namaste, mujhe 5 gram ki anguthi chahiye 916 gold mein, floral design";

  it("keeps values the message supports (Hinglish, 916 = 22K)", () => {
    const r = checkAgainstText(text, { ...base, category: "Ring", purity: "22K", weightMin: 5, weightMax: 5, designNotes: "floral" });
    expect(r.rejected).toEqual([]);
    expect(r.fields).toMatchObject({ category: "Ring", purity: "22K", weightMin: 5 });
  });

  it("drops a weight that is not in the message", () => {
    const r = checkAgainstText(text, { ...base, weightMin: 4, weightMax: 6 });
    expect(r.fields.weightMin).toBeNull();
    expect(r.rejected).toEqual(["weight"]);
  });

  it("drops a purity or design with no supporting word", () => {
    const r = checkAgainstText(text, { ...base, purity: "18K", category: "Necklace" });
    expect(r.fields.purity).toBeNull();
    expect(r.fields.category).toBeNull();
    expect(r.rejected).toEqual(["purity", "category"]);
  });
});

describe("AI reply: numbers only ever come from code", () => {
  const values = {
    "{DESIGN}": "Floral Ring",
    "{PURITY}": "22K",
    "{WEIGHT}": "5 g",
    "{TOTAL}": "₹79,510",
    "{RATE}": "₹1,34,300/10g",
    "{LOCK}": "rate locked for 7 days on 25% advance",
    "{LINK}": "https://parakh-iota.vercel.app/q/abc12345",
  } as const;

  it("fills placeholders in a clean draft", () => {
    const out = fillReply("Hi Riya! Your {PURITY} {DESIGN} comes to {TOTAL} at today's rate of {RATE}. Details: {LINK}", values);
    expect(out).toBe("Hi Riya! Your 22K Floral Ring comes to ₹79,510 at today's rate of ₹1,34,300/10g. Details: https://parakh-iota.vercel.app/q/abc12345");
  });

  it.each([
    ["writes its own price", "Your ring is ₹80,000. Total {TOTAL}. {LINK}"],
    ["writes a digit", "Ready in 7 days! {TOTAL} {LINK}"],
    ["writes an amount in words", "About one lakh rupees, exactly {TOTAL}. {LINK}"],
    ["writes its own link", "See https://evil.example {TOTAL} {LINK}"],
    ["leaves out the total", "Hi! Please open {LINK}"],
    ["repeats the link", "{TOTAL} {LINK} {LINK}"],
    ["invents a placeholder", "{TOTAL} {DISCOUNT} {LINK}"],
  ])("rejects a draft that %s", (_why, draft) => {
    expect(fillReply(draft, values)).toBeNull();
  });
});
