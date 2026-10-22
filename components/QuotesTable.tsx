import Link from "next/link";
import { formatDate, formatGramsFixed, formatTotal, formatWeightRange } from "@/lib/format";
import { effectiveStatus, type Quote } from "@/lib/types";
import StatusPill from "./StatusPill";

export type QuoteRow = Pick<
  Quote,
  "slug" | "customerName" | "designName" | "weightMin" | "weightMax" | "breakdown" | "status" | "rateLockExpiresAt" | "createdAt"
>;

export function toRow(q: Quote): QuoteRow {
  const { slug, customerName, designName, weightMin, weightMax, breakdown, status, rateLockExpiresAt, createdAt } = q;
  return { slug, customerName, designName, weightMin, weightMax, breakdown, status, rateLockExpiresAt, createdAt };
}

/** Table on wider screens, stacked cards on phones. Rows open the customer quote link. */
export default function QuotesTable({ quotes }: { quotes: QuoteRow[] }) {
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th scope="col" className="py-3 pr-4 font-medium">Customer</th>
            <th scope="col" className="py-3 pr-4 font-medium">Design</th>
            <th scope="col" className="py-3 pr-4 text-right font-medium">Weight</th>
            <th scope="col" className="py-3 pr-4 text-right font-medium">Total Amount</th>
            <th scope="col" className="py-3 pr-4 font-medium">Status</th>
            <th scope="col" className="py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.slug} className="group border-b border-line/70 last:border-0 hover:bg-forest-tint/40">
              <td className="py-3.5 pr-4">
                <Link href={`/q/${q.slug}`} className="font-medium underline-offset-4 hover:underline group-hover:text-forest">
                  {q.customerName ?? "Customer"}
                </Link>
              </td>
              <td className="py-3.5 pr-4">{q.designName}</td>
              <td className="tnum py-3.5 pr-4 text-right">
                {q.weightMin === q.weightMax ? formatGramsFixed(q.weightMin) : formatWeightRange(q.weightMin, q.weightMax)}
              </td>
              <td className="tnum py-3.5 pr-4 text-right">{formatTotal(q.breakdown)}</td>
              <td className="py-3.5 pr-4">
                <StatusPill status={effectiveStatus(q)} />
              </td>
              <td className="tnum py-3.5 text-muted">{formatDate(q.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-3 md:hidden">
        {quotes.map((q) => (
          <li key={q.slug}>
            <Link href={`/q/${q.slug}`} className="block rounded-xl border border-line p-4 hover:border-forest">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{q.customerName ?? "Customer"}</p>
                  <p className="text-sm text-muted">
                    {q.designName} · <span className="tnum">{formatWeightRange(q.weightMin, q.weightMax)}</span>
                  </p>
                </div>
                <StatusPill status={effectiveStatus(q)} />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="tnum font-semibold">{formatTotal(q.breakdown)}</span>
                <span className="tnum text-sm text-muted">{formatDate(q.createdAt)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
