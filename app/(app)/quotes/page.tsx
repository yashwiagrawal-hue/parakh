import { Plus } from "lucide-react";
import Link from "next/link";
import QuotesTable, { toRow } from "@/components/QuotesTable";
import { listQuotes } from "@/lib/db";
import { effectiveStatus, type QuoteStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS: ("All" | QuoteStatus)[] = ["All", "Sent", "Viewed", "Advance Paid", "Expired"];

export default async function QuotesPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const all = await listQuotes();
  const term = (searchParams.q ?? "").trim().toLowerCase();
  const status = FILTERS.find((f) => f === searchParams.status) ?? "All";

  const quotes = all.filter(
    (q) =>
      (status === "All" || effectiveStatus(q) === status) &&
      (!term || [q.customerName, q.designName, q.category, q.slug].some((v) => v?.toLowerCase().includes(term))),
  );

  const href = (s: string) => {
    const p = new URLSearchParams();
    if (term) p.set("q", term);
    if (s !== "All") p.set("status", s);
    const qs = p.toString();
    return qs ? `/quotes?${qs}` : "/quotes";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Quotes</h1>
        <Link href="/quotes/new" className="btn">
          <Plus aria-hidden size={18} /> New Quote
        </Link>
      </div>

      <div className="card space-y-4 p-4 sm:p-6">
        <form role="search" className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="quote-search" className="sr-only">
            Search by customer or design
          </label>
          <input id="quote-search" name="q" type="search" defaultValue={term} placeholder="Search by customer or design" className="field sm:max-w-sm" />
          {status !== "All" && <input type="hidden" name="status" value={status} />}
          <button className="btn-outline">Search</button>
        </form>

        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={href(f)}
              aria-current={f === status ? "true" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${
                f === status ? "border-forest bg-forest text-on-forest" : "border-line bg-surface hover:border-forest"
              }`}
            >
              {f}
            </Link>
          ))}
        </nav>

        {quotes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium">{all.length === 0 ? "No quotes yet" : "No quotes match"}</p>
            <p className="mt-1 text-sm text-muted">
              {all.length === 0 ? "Create your first quote from a WhatsApp enquiry." : "Try another name or clear the filter."}
            </p>
          </div>
        ) : (
          <QuotesTable quotes={quotes.map(toRow)} />
        )}
      </div>
    </div>
  );
}
