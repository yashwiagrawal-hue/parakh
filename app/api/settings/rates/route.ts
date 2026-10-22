import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRates, maxIbjaGap } from "@/lib/checks";
import { getJeweller, saveJeweller } from "@/lib/db";

export const dynamic = "force-dynamic";

const rates = z.object({
  rate22k: z.number().positive(),
  rate24k: z.number().positive(),
  rate18k: z.number().positive(),
  ibjaRate22k: z.number().positive(),
  defaultMakingPct: z.number().gt(0).max(100).optional(),
  defaultWastagePct: z.number().min(0).max(100).optional(),
  defaultGstPct: z.number().min(0).max(28).optional(),
  rateLockDays: z.number().int().min(1).max(90).optional(),
  rateLockAdvancePct: z.number().min(0).max(100).optional(),
});

export async function PUT(req: Request) {
  const parsed = rates.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the rate fields and try again." }, { status: 400 });

  const r = parsed.data;
  const check = checkRates({ ratePer10g: r.rate22k, ibjaPer10g: r.ibjaRate22k, maxGap: maxIbjaGap() });
  for (const [label, v] of [["24K", r.rate24k], ["18K", r.rate18k]] as const) {
    if (v < 30000) check.errors.push(`The ${label} rate looks like a per-gram rate. Enter the rate per 10 g.`);
  }
  if (check.errors.length) return NextResponse.json({ error: check.errors.join(" ") }, { status: 422 });

  const current = await getJeweller();
  const next = { ...current, ...r, rateUpdatedAt: new Date().toISOString() };
  await saveJeweller(next);
  return NextResponse.json(next);
}
