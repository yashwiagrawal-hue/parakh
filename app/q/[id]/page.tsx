import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DesignPreview from "@/components/DesignPreview";
import QuoteCopy from "@/components/QuoteCopy";
import { formatGap, formatPaise, formatRupees, perGramRange } from "@/lib/pricing";
import { getApprovedQuote } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your quote · Parakh",
  robots: { index: false, follow: false },
};

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });
const g = (n: number) => String(Math.round(n * 100) / 100);

export default async function QuotePage({ params }: { params: { id: string } }) {
  const q = await getApprovedQuote(params.id);
  if (!q) notFound();

  const { input, result } = q;
  const same = input.weightMinG === input.weightMaxG;
  const gstPct = Math.round(q.gstRate * 100);
  const makingText =
    input.making.type === "percent"
      ? `Making charge (${Math.round(input.making.value * 1000) / 10}% of gold)`
      : input.making.type === "perGram"
        ? `Making charge (${formatRupees(input.making.value)}/g)`
        : "Making charge (flat)";

  const rows: [string, number, number][] = [
    ["Gold value", result.min.goldValue, result.max.goldValue],
    [`Wastage (${Math.round(input.wastagePct * 1000) / 10}%)`, result.min.wastage, result.max.wastage],
    [makingText, result.min.making, result.max.making],
    ...(result.max.stones > 0
      ? ([[`Stones (${input.stones.map((s) => s.label).join(", ")})`, result.min.stones, result.max.stones]] as [
          string,
          number,
          number,
        ][])
      : []),
    ["Subtotal", result.min.subtotal, result.max.subtotal],
    [`GST (${gstPct}%)`, result.min.gst, result.max.gst],
  ];

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-6">
      <header>
        <p className="text-sm text-muted">Quote from {q.jeweller.shopName}</p>
        <h1 className="text-2xl font-bold">
          {q.customerFirstName ? `${q.customerFirstName}, your quote` : "Your quote"}
        </h1>
      </header>

      <section aria-label="Design" className="space-y-4">
        <DesignPreview image={q.designImage} name={q.designName} demo={q.demoWeights} />
        <div className="text-center">
          <h2 className="text-xl font-semibold">{q.designName}</h2>
          <p className="text-muted">
            {input.purity}
            {q.sizeLabel ? ` · size ${q.sizeLabel}` : ""}
          </p>
        </div>
      </section>

      <section aria-label="Weight and price" className="card space-y-2 text-center">
        <p className="text-sm text-muted">{same ? "Weight" : "Weight range"}</p>
        <p className="text-2xl font-bold">{same ? `${g(input.weightMinG)} g` : `${g(input.weightMinG)} to ${g(input.weightMaxG)} g`}</p>
        <p className="pt-2 text-sm text-muted">Price, all-in with GST</p>
        <p className="text-3xl font-bold">
          {same ? formatPaise(result.max.total) : `${formatPaise(result.min.total)} to ${formatPaise(result.max.total)}`}
        </p>
        <p className="text-muted">
          {same
            ? `${formatPaise(result.max.perGram)} per gram, all-in`
            : `${formatPaise(perGramRange(result)[0])} to ${formatPaise(perGramRange(result)[1])} per gram, all-in`}
        </p>
      </section>

      <section aria-label="Price breakup" className="card">
        <h2 className="mb-2 text-lg font-semibold">Price breakup</h2>
        <table className="w-full text-sm">
          <caption className="sr-only">Price breakup at the lowest and highest weight</caption>
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 text-left font-medium" />
              <th scope="col" className="py-1 text-right font-medium">
                At {g(input.weightMinG)} g
              </th>
              {!same && (
                <th scope="col" className="py-1 text-right font-medium">
                  At {g(input.weightMaxG)} g
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(([label, min, max]) => (
              <tr key={label}>
                <th scope="row" className="py-2 pr-2 text-left font-normal">
                  {label}
                </th>
                <td className="py-2 text-right">{formatPaise(min)}</td>
                {!same && <td className="py-2 text-right">{formatPaise(max)}</td>}
              </tr>
            ))}
            <tr className="font-semibold">
              <th scope="row" className="py-2 pr-2 text-left">
                Total
              </th>
              <td className="py-2 text-right">{formatPaise(result.min.total)}</td>
              {!same && <td className="py-2 text-right">{formatPaise(result.max.total)}</td>}
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted">You pay for the actual weight of the finished piece, within the range above.</p>
      </section>

      <section aria-label="Rate compared with IBJA" className="card space-y-1">
        <h2 className="text-lg font-semibold">Gold rate</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">{q.jeweller.shopName} rate ({input.purity})</dt>
          <dd className="text-right">{formatRupees(input.ratePerG)} per gram</dd>
          <dt className="text-muted">IBJA benchmark</dt>
          <dd className="text-right">{formatRupees(input.ibjaRatePerG)} per gram</dd>
          <dt className="text-muted">IBJA rate from</dt>
          <dd className="text-right">
            {dateFmt.format(new Date(`${q.ibjaDate}T00:00:00Z`))}, {q.ibjaSession}
          </dd>
        </dl>
        <p className="pt-1 font-medium">{formatGap(result.ibjaGapPct)}</p>
        {q.warnings.map((w) => (
          <p key={w} className="text-sm text-warn">
            {w}
          </p>
        ))}
      </section>

      <section aria-label="Rate lock terms" className="card space-y-1">
        <h2 className="text-lg font-semibold">Rate lock</h2>
        <p>
          Pay an advance of <strong>{formatPaise(result.advance)}</strong> ({Math.round(result.advanceShare * 100)}% of
          the highest price) to lock today&apos;s rate for <strong>{input.lockDays} days</strong>.
        </p>
        <p className="text-muted">Your rate is locked until {dateFmt.format(new Date(q.lockEndsAt))}.</p>
        {q.demoWeights && <p className="text-sm text-warn">Demo weights. Final weights are confirmed by the jeweller.</p>}
      </section>

      <section aria-label="Jeweller" className="card space-y-1">
        <h2 className="text-lg font-semibold">{q.jeweller.shopName}</h2>
        <p className="text-muted">{q.jeweller.area}</p>
        <p>
          <a className="underline" href={`tel:${q.jeweller.contact.replace(/\s+/g, "")}`}>
            {q.jeweller.contact}
          </a>
        </p>
      </section>

      <QuoteCopy quote={q} />
      <p className="text-xs text-muted">Approved on {dateFmt.format(new Date(q.approvedAt))}. Quote {q.id}.</p>
    </main>
  );
}
