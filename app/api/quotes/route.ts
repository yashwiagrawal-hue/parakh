import { NextResponse } from "next/server";
import { findDesign, findSize, jeweller } from "@/lib/catalogue";
import { checkRates } from "@/lib/checks";
import { serverConfig } from "@/lib/config";
import { computeQuote, lockEndsAt, type PricingInput } from "@/lib/pricing";
import { cleanFirstName, quoteRequestSchema, type QuoteRecord } from "@/lib/quote";
import { getApprovedQuote, newQuoteId, saveApprovedQuote } from "@/lib/store";

export const dynamic = "force-dynamic";

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** The jeweller approves: validate, recompute every number on the server, save, return the id. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("The request was not valid JSON. Reload the page and try again.");
  }

  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Some quote fields are missing or invalid. Check the form.");
  }
  const q = parsed.data;
  const { pricing, maxIbjaGap } = serverConfig();

  const lockShare = jeweller.lockTable[q.lockDays];
  if (lockShare === undefined) {
    return fail("Pick a lock period from your lock table: " + Object.keys(jeweller.lockTable).join(", ") + " days.");
  }

  const check = checkRates({
    ratePerG: q.ratePerG,
    ibjaRatePerG: q.ibjaRatePerG,
    ibjaDate: q.ibjaDate,
    maxIbjaGap,
  });
  if (check.errors.length > 0) return fail(check.errors.join(" "), 422);

  // Weights for catalogue designs always come from the catalogue, never from the browser.
  let weightMinG = q.weightMinG;
  let weightMaxG = q.weightMaxG;
  let designName = "Custom piece";
  let designImage: string | null = null;
  let demoWeights = false;
  let item = q.item ?? null;
  if (q.designId) {
    const design = findDesign(q.designId);
    if (!design) return fail("That design is not in the catalogue. Pick another design.");
    const size = q.sizeLabel ? findSize(design, q.purity, q.sizeLabel) : undefined;
    if (!size) return fail("That size is not listed for this design and purity. Pick another size.");
    weightMinG = size.weightMinG;
    weightMaxG = size.weightMaxG;
    designName = design.name;
    designImage = design.image;
    demoWeights = design.demo;
    item = design.item;
  }

  if (q.supersedes) {
    const old = await getApprovedQuote(q.supersedes);
    if (!old) return fail("The quote you are replacing was not found. Check the id.");
  }

  const input: PricingInput = {
    weightMinG,
    weightMaxG,
    purity: q.purity,
    ratePerG: q.ratePerG,
    ibjaRatePerG: q.ibjaRatePerG,
    making: q.making,
    wastagePct: q.wastagePct,
    stones: q.stones,
    lockDays: q.lockDays,
    lockTable: jeweller.lockTable,
  };

  const now = new Date().toISOString();
  const record: QuoteRecord = {
    id: newQuoteId(),
    status: "approved",
    createdAt: now,
    approvedAt: now,
    lockEndsAt: lockEndsAt(now, q.lockDays),
    supersedes: q.supersedes ?? null,
    customerFirstName: cleanFirstName(q.customerFirstName),
    designName,
    designImage,
    item,
    sizeLabel: q.sizeLabel,
    demoWeights,
    ibjaDate: q.ibjaDate,
    ibjaSession: q.ibjaSession,
    warnings: check.warnings,
    jeweller: { shopName: jeweller.shopName, area: jeweller.area, contact: jeweller.contact },
    input,
    gstRate: pricing.gstRate,
    result: computeQuote(input, pricing),
  };

  try {
    await saveApprovedQuote(record);
  } catch {
    return fail("The quote could not be saved. Try again in a moment.", 500);
  }
  return NextResponse.json({ id: record.id }, { status: 201 });
}
