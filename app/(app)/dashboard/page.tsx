import { BellRing, FileText, Hourglass, Plus } from "lucide-react";
import Link from "next/link";
import GoldRateCard from "@/components/GoldRateCard";
import QuotesTable, { toRow } from "@/components/QuotesTable";
import { getJeweller, listQuotes } from "@/lib/db";
import { effectiveStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;

function greeting(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const [j, quotes] = await Promise.all([getJeweller(), listQuotes()]);
  const now = new Date();

  const sentThisWeek = quotes.filter((q) => q.status !== "Draft" && now.getTime() - Date.parse(q.createdAt) < 7 * 24 * HOUR).length;
  const open = quotes.filter((q) => {
    const s = effectiveStatus(q, now);
    return s === "Sent" || s === "Viewed";
  });
  const expiringSoon = open.filter((q) => Date.parse(q.rateLockExpiresAt) - now.getTime() < 48 * HOUR).length;

  const stats = [
    { icon: FileText, value: sentThisWeek, label: "Quotes sent this week", tone: "bg-forest-tint text-forest" },
    { icon: Hourglass, value: open.length, label: "Pending payments", tone: "bg-gold-tint text-gold-ink" },
    { icon: BellRing, value: expiringSoon, label: "Rate locks expiring soon", tone: "bg-pill-viewed text-up" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-[1.65rem]">
            {greeting(now)}, {j.name} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-muted">Here&apos;s your overview for today.</p>
        </div>
        <div className="lg:w-[22rem]">
          <GoldRateCard rate22k={j.rate22k} ibjaRate22k={j.ibjaRate22k} />
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ icon: Icon, value, label, tone }) => (
          <li key={label} className="card flex items-center gap-4 p-4 sm:p-5">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
              <Icon aria-hidden size={22} strokeWidth={1.75} />
            </span>
            <div>
              <p className="tnum text-2xl font-semibold">{value}</p>
              <p className="text-sm text-muted">{label}</p>
            </div>
          </li>
        ))}
      </ul>

      <Link href="/quotes/new" className="btn w-full py-3.5 text-[1.05rem]">
        <Plus aria-hidden size={20} /> Create New Quote
      </Link>

      <section aria-labelledby="recent-h" className="card p-4 sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="recent-h" className="text-lg">
            Recent Quotes
          </h2>
          <Link href="/quotes" className="text-sm font-medium text-forest underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        {quotes.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-medium">No quotes yet</p>
            <p className="mt-1 text-sm text-muted">Paste your first WhatsApp enquiry to create a quote in under 2 minutes.</p>
          </div>
        ) : (
          <QuotesTable quotes={quotes.slice(0, 5).map(toRow)} />
        )}
      </section>
    </div>
  );
}
