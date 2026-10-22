import { Lock } from "lucide-react";
import { formatDiff, formatINR, formatLine, formatTotal, formatWeightRange } from "@/lib/format";
import type { PriceRange } from "@/lib/pricing";

export interface BreakdownProps {
  purity: string;
  rateUsed: number;
  ibjaRateUsed: number;
  breakdown: PriceRange;
  makingPct: number;
  wastagePct: number;
  gstPct: number;
  rateLockDays: number;
  rateLockAdvancePct: number;
  /**
   * "jeweller" shows "Today's Gold Rate" and the rate-lock strip.
   * "customer" shows the per-10 g line with the IBJA benchmark beneath; the page shows lock terms separately.
   */
  variant?: "jeweller" | "customer";
}

const pct = (n: number) => `${Math.round(n * 100) / 100}%`;

/** Gold rate vs IBJA, line items, highlighted total and the rate-lock strip. All numbers come from lib/pricing. */
export default function PriceBreakdown(p: BreakdownProps) {
  const { min, max } = p.breakdown;
  const diff = p.rateUsed - p.ibjaRateUsed;
  const diffClass = diff > 0 ? "text-up" : diff < 0 ? "text-down" : "text-muted";
  const lines: [string, number, number][] = [
    [`Gold (${formatWeightRange(min.weight, max.weight)})`, min.gold, max.gold],
    [`Making Charges (${pct(p.makingPct)})`, min.making, max.making],
    ...(max.wastage > 0 ? ([[`Wastage (${pct(p.wastagePct)})`, min.wastage, max.wastage]] as [string, number, number][]) : []),
    ...(max.stones > 0 ? ([["Stones", min.stones, max.stones]] as [string, number, number][]) : []),
    [`GST (${pct(p.gstPct)})`, min.gst, max.gst],
  ];

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      {p.variant === "customer" ? (
        <dl className="tnum space-y-1 border-b border-line px-4 py-3.5 text-sm sm:px-5">
          <div className="flex justify-between gap-3">
            <dt>Gold Rate ({p.purity})</dt>
            <dd className="font-semibold">{formatINR(p.rateUsed)} / 10g</dd>
          </div>
          <div className="flex justify-between gap-3 text-muted">
            <dt>IBJA Benchmark</dt>
            <dd>
              {formatINR(p.ibjaRateUsed)} <span className={`font-medium ${diffClass}`}>{formatDiff(p.rateUsed, p.ibjaRateUsed)}</span>
            </dd>
          </div>
        </dl>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-forest-tint px-4 py-3.5 sm:px-5">
          <p className="text-sm">Today&apos;s Gold Rate ({p.purity})</p>
          <div className="text-right">
            <p className="tnum text-lg font-semibold">
              {formatINR(p.rateUsed)} <span className="text-sm font-normal text-muted">/ 10g</span>
            </p>
            <p className="tnum text-xs text-muted">
              IBJA: {formatINR(p.ibjaRateUsed)} <span className={`font-medium ${diffClass}`}>{formatDiff(p.rateUsed, p.ibjaRateUsed)}</span>
            </p>
          </div>
        </div>
      )}

      <dl className="tnum divide-y divide-line/70 px-4 text-[0.95rem] sm:px-5">
        {lines.map(([label, a, b]) => (
          <div key={label} className="flex justify-between gap-3 py-3">
            <dt>{label}</dt>
            <dd className="text-right">{formatLine(a, b)}</dd>
          </div>
        ))}
      </dl>

      <div className="tnum flex items-center justify-between gap-3 bg-gold-tint px-4 py-4 sm:px-5">
        <span className="font-semibold">Total Estimate</span>
        <span className="text-right text-xl font-bold">{formatTotal(p.breakdown)}</span>
      </div>

      {p.variant !== "customer" && (
        <div className="flex items-start gap-3 border-t border-line px-4 py-3.5 text-sm sm:px-5">
          <Lock aria-hidden size={18} className="mt-0.5 shrink-0 text-gold-ink" />
          <p>
            Rate locked for {p.rateLockDays} days on {p.rateLockAdvancePct}% advance
          </p>
        </div>
      )}
    </div>
  );
}
