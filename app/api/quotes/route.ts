import { NextResponse } from "next/server";
import { checkRates, maxIbjaGap } from "@/lib/checks";
import { QuoteExistsError, createQuote, getJeweller } from "@/lib/db";
import { buildQuote, newSlug, quoteDraftSchema } from "@/lib/quotes";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** "Confirm & Create Link": validate, recompute every number from today's rates, save as Sent. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = quoteDraftSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Some quote details are missing. Check the form.");

  const jeweller = await getJeweller();
  const check = checkRates({ ratePer10g: jeweller.rate22k, ibjaPer10g: jeweller.ibjaRate22k, maxGap: maxIbjaGap() });
  if (check.errors.length) return fail(`${check.errors.join(" ")} Fix it in Rate Settings.`, 422);

  for (let attempt = 0; attempt < 3; attempt++) {
    const quote = buildQuote(parsed.data, jeweller, { slug: newSlug(), createdAt: new Date().toISOString() });
    try {
      await createQuote(quote);
      return NextResponse.json({ slug: quote.slug }, { status: 201 });
    } catch (e) {
      if (!(e instanceof QuoteExistsError)) return fail("The quote could not be saved. Try again in a moment.", 500);
    }
  }
  return fail("The quote could not be saved. Try again in a moment.", 500);
}
