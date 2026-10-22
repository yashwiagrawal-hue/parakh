import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuote } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { SLUG_RE } from "@/lib/quotes";

export const dynamic = "force-dynamic";

/**
 * TODO(payments): placeholder only. No payment is processed here.
 * Later: a UPI intent link (upi://pay?pa=...&am=...) or a payment gateway, then mark the quote "Advance Paid".
 */
export default async function PayAdvancePage({ params }: { params: { slug: string } }) {
  const q = SLUG_RE.test(params.slug) ? await getQuote(params.slug) : null;
  if (!q) notFound();

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="card space-y-4 p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-tint text-gold-ink">
          <Construction aria-hidden size={26} strokeWidth={1.6} />
        </span>
        <h1 className="font-serif text-2xl">Online advance payment is coming soon</h1>
        <p className="text-muted">
          To lock your rate, pay the advance of <strong className="tnum text-ink">{formatINR(q.advanceAmount)}</strong> directly
          to {q.jewellerName}. Call or WhatsApp them on{" "}
          <a className="font-medium text-forest underline" href={`tel:${q.jewellerPhone.replace(/\s+/g, "")}`}>
            {q.jewellerPhone}
          </a>
          .
        </p>
        <p className="rounded-lg bg-pill-muted px-3 py-2 text-xs text-muted">Demo: no payment is taken on this page.</p>
        <Link href={`/q/${q.slug}`} className="btn-outline w-full">
          <ArrowLeft aria-hidden size={17} /> Back to quote
        </Link>
      </div>
    </main>
  );
}
