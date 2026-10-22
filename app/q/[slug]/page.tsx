import { BadgeCheck, CircleAlert, Lock, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PriceBreakdown from "@/components/PriceBreakdown";
import { MarkViewed, QuoteButtons } from "@/components/QuoteActions";
import { getQuote } from "@/lib/db";
import { formatINR, formatLongDate, formatTotal, formatWeightRange } from "@/lib/format";
import { SLUG_RE, quoteTitle } from "@/lib/quotes";
import { effectiveStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return SLUG_RE.test(slug) ? getQuote(slug) : null;
}

/** Open Graph tags so the WhatsApp link preview shows the title, total and jeweller. */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const q = await load(params.slug);
  if (!q) return { title: "Quote not found · Parakh", robots: { index: false } };
  const title = `${quoteTitle(q)} from ${q.jewellerName}`;
  const description = `Total estimate ${formatTotal(q.breakdown)} incl. GST · ${q.purity} gold · ${formatWeightRange(q.weightMin, q.weightMax)} · Rate locked for ${q.rateLockDays} days.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    // The preview image comes from ./opengraph-image.tsx (a PNG, which WhatsApp can show).
    openGraph: { title, description, siteName: "Parakh", type: "website" },
  };
}

export default async function CustomerQuotePage({ params }: { params: { slug: string } }) {
  const q = await load(params.slug);
  if (!q) notFound();

  const status = effectiveStatus(q);
  const expired = status === "Expired";
  const image = q.designImageUrl;

  return (
    <div className="min-h-screen">
      <MarkViewed slug={q.slug} />
      <header className="border-b border-line bg-surface/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5">
          <span className="font-serif text-2xl text-forest">Parakh</span>
          <span className="flex items-center gap-1.5 text-xs text-muted sm:text-sm">
            <BadgeCheck aria-hidden size={17} className="text-gold-ink" />
            Trusted by {q.jewellerName}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-7">
        <div className="text-center">
          <h1 className="font-serif text-[2rem] leading-tight sm:text-4xl">{quoteTitle(q)}</h1>
          <p className="mt-1.5 text-muted">Complete price breakdown for transparency</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_1.4fr]">
          <figure className="card h-fit overflow-hidden">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={q.designName} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-gold-tint text-muted">Custom design</div>
            )}
            <figcaption className="p-4">
              <p className="font-semibold">{q.designName}</p>
              <p className="tnum text-sm text-muted">
                {q.purity} Gold | Estimated {formatWeightRange(q.weightMin, q.weightMax)}
              </p>
              <p className="mt-2 text-xs text-muted">
                Catalogue image. The finished piece may vary slightly. You pay for the actual weight, within the range shown.
              </p>
            </figcaption>
          </figure>

          <PriceBreakdown
            variant="customer"
            purity={q.purity}
            rateUsed={q.rateUsed}
            ibjaRateUsed={q.ibjaRateUsed}
            breakdown={q.breakdown}
            makingPct={q.makingPct}
            wastagePct={q.wastagePct}
            gstPct={q.gstPct}
            rateLockDays={q.rateLockDays}
            rateLockAdvancePct={q.rateLockAdvancePct}
          />
        </div>

        {expired ? (
          <div role="status" className="flex items-start gap-3 rounded-card border border-up/30 bg-up/5 p-4">
            <CircleAlert aria-hidden size={20} className="mt-0.5 shrink-0 text-up" />
            <div>
              <p className="font-semibold">This rate has expired</p>
              <p className="text-sm text-muted">
                The lock ended on {formatLongDate(q.rateLockExpiresAt)}. Please contact {q.jewellerName} for an updated quote.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-card border border-gold/40 bg-gold-tint p-4">
            <Lock aria-hidden size={20} className="mt-0.5 shrink-0 text-gold-ink" />
            <div className="tnum">
              <p className="font-semibold">
                Rate locked for {q.rateLockDays} days on {q.rateLockAdvancePct}% advance payment
              </p>
              <p className="text-sm text-muted">
                {status === "Advance Paid" ? "Advance received. " : ""}Pay an advance of{" "}
                <strong className="text-ink">{formatINR(q.advanceAmount)}</strong> to keep this rate until{" "}
                <strong className="text-ink">{formatLongDate(q.rateLockExpiresAt)}</strong>.
              </p>
            </div>
          </div>
        )}

        <QuoteButtons slug={q.slug} expired={expired || status === "Advance Paid"} />

        <footer className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">{q.jewellerName}</p>
            <p className="text-sm text-muted">Quote created {formatLongDate(q.createdAt)}</p>
          </div>
          <a href={`tel:${q.jewellerPhone.replace(/\s+/g, "")}`} className="btn-outline no-print min-h-0 px-3 py-2 text-sm">
            <Phone aria-hidden size={15} /> {q.jewellerPhone}
          </a>
        </footer>
      </main>
    </div>
  );
}
