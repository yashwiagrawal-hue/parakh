import Link from "next/link";
import RatesPanel from "@/components/RatesPanel";
import { formatPaise } from "@/lib/pricing";
import { listRecentQuotes } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recent = await listRecentQuotes();
  const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Jeweller home</h1>
        <Link href="/new" className="btn">
          New quote
        </Link>
      </div>

      <RatesPanel />

      <section aria-labelledby="recent-h" className="card space-y-3">
        <h2 id="recent-h" className="text-xl font-semibold">
          Recent quotes
        </h2>
        {recent.length === 0 ? (
          <p className="text-muted">No quotes yet. Create one from New quote.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">
                    {q.designName} · {q.input.purity}
                    {q.customerFirstName ? ` · ${q.customerFirstName}` : ""}
                  </p>
                  <p className="text-sm text-muted">
                    {formatPaise(q.result.min.total)} to {formatPaise(q.result.max.total)} ·{" "}
                    {dateFmt.format(new Date(q.approvedAt))}
                  </p>
                </div>
                <Link href={`/q/${q.id}`} className="btn-quiet">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
