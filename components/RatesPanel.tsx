"use client";

import { useEffect, useState } from "react";
import { checkRates } from "@/lib/checks";
import { PURITIES, formatGap, ibjaGapPct, type Purity } from "@/lib/pricing";
import { defaultRates, useRates, type Rates } from "@/lib/rates";

export default function RatesPanel() {
  const { rates, ready, save } = useRates();
  const [draft, setDraft] = useState<Rates>(rates);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ready) setDraft(rates);
  }, [ready, rates]);

  const num = (v: string) => (v === "" ? 0 : Number(v));
  const setRate = (key: "ratePerG" | "ibjaRatePerG", p: Purity, v: string) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [key]: { ...d[key], [p]: num(v) } }));
  };

  const checks = PURITIES.map((p) => ({
    purity: p,
    ...checkRates({
      ratePerG: draft.ratePerG[p],
      ibjaRatePerG: draft.ibjaRatePerG[p],
      ibjaDate: draft.ibjaDate,
    }),
  }));
  const blocked = checks.some((c) => c.errors.length > 0);
  const warnings = Array.from(new Set(checks.flatMap((c) => c.warnings)));

  return (
    <section aria-labelledby="rates-h" className="card space-y-4">
      <div>
        <h2 id="rates-h" className="text-xl font-semibold">
          Today&apos;s rates
        </h2>
        <p className="text-muted">
          Enter your rate and the IBJA rate in rupees per gram. They are used on every new quote.
        </p>
      </div>

      <div className="grid grid-cols-[3.5rem_1fr_1fr] items-end gap-3">
        <span />
        <span className="label mb-0">Your rate (₹/g)</span>
        <span className="label mb-0">IBJA rate (₹/g)</span>
        {PURITIES.map((p) => {
          const c = checks.find((x) => x.purity === p)!;
          const gap =
            draft.ratePerG[p] > 0 && draft.ibjaRatePerG[p] > 0
              ? formatGap(ibjaGapPct(draft.ratePerG[p], draft.ibjaRatePerG[p]))
              : null;
          return (
            <div key={p} className="contents">
              <span className="pb-2 font-semibold">{p}</span>
              <input
                aria-label={`Your rate for ${p}, rupees per gram`}
                className="field"
                inputMode="decimal"
                type="number"
                min="0"
                step="any"
                value={draft.ratePerG[p] || ""}
                onChange={(e) => setRate("ratePerG", p, e.target.value)}
              />
              <input
                aria-label={`IBJA rate for ${p}, rupees per gram`}
                className="field"
                inputMode="decimal"
                type="number"
                min="0"
                step="any"
                value={draft.ibjaRatePerG[p] || ""}
                onChange={(e) => setRate("ibjaRatePerG", p, e.target.value)}
              />
              {(gap || c.errors.length > 0) && (
                <p
                  className={`col-span-3 -mt-1 text-sm ${c.errors.length ? "text-danger" : "text-muted"}`}
                >
                  {c.errors.length ? c.errors.join(" ") : gap}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="ibja-date">
            IBJA rate date
          </label>
          <input
            id="ibja-date"
            className="field"
            type="date"
            value={draft.ibjaDate}
            onChange={(e) => {
              setSaved(false);
              setDraft((d) => ({ ...d, ibjaDate: e.target.value }));
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor="ibja-session">
            IBJA session
          </label>
          <select
            id="ibja-session"
            className="field"
            value={draft.ibjaSession}
            onChange={(e) => {
              setSaved(false);
              setDraft((d) => ({ ...d, ibjaSession: e.target.value as "AM" | "PM" }));
            }}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      {warnings.map((w) => (
        <p key={w} role="status" className="text-sm text-warn">
          {w}
        </p>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="btn"
          disabled={blocked}
          onClick={() => {
            save(draft);
            setSaved(true);
          }}
        >
          Save today&apos;s rates
        </button>
        <button
          className="btn-quiet"
          onClick={() => {
            setSaved(false);
            setDraft(defaultRates());
          }}
        >
          Reset to demo rates
        </button>
        {saved && (
          <span role="status" className="text-ok">
            Saved. New quotes will use these rates.
          </span>
        )}
        {!draft.savedAt && !saved && ready && (
          <span className="text-sm text-muted">Showing demo rates. Save to confirm today&apos;s rates.</span>
        )}
      </div>
    </section>
  );
}
