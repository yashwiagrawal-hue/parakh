"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkRates } from "@/lib/checks";
import { formatDiff, formatLongDate } from "@/lib/format";
import { derivedRates } from "@/lib/pricing";
import type { Jeweller } from "@/lib/types";

type Field = keyof Pick<
  Jeweller,
  | "rate22k"
  | "rate24k"
  | "rate18k"
  | "ibjaRate22k"
  | "defaultMakingPct"
  | "defaultWastagePct"
  | "defaultGstPct"
  | "rateLockDays"
  | "rateLockAdvancePct"
>;

function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  suffix,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input id={id} className="field tnum pr-16" type="number" inputMode="decimal" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function RateSettingsForm({ jeweller }: { jeweller: Jeweller }) {
  const router = useRouter();
  const init = Object.fromEntries(
    (["rate22k", "rate24k", "rate18k", "ibjaRate22k", "defaultMakingPct", "defaultWastagePct", "defaultGstPct", "rateLockDays", "rateLockAdvancePct"] as Field[]).map((k) => [k, String(jeweller[k])]),
  ) as Record<Field, string>;
  const [v, setV] = useState(init);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: Field) => (val: string) => {
    setState("idle");
    setV((cur) => ({ ...cur, [k]: val }));
  };

  const n = (k: Field) => Number(v[k]);
  const check = checkRates({ ratePer10g: n("rate22k"), ibjaPer10g: n("ibjaRate22k") });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError(null);
    const body = Object.fromEntries(Object.entries(v).map(([k, val]) => [k, Number(val)]));
    const res = await fetch("/api/settings/rates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (!res?.ok) {
      setState("idle");
      setError((await res?.json().catch(() => null))?.error ?? "Settings could not be saved. Check your connection and try again.");
      return;
    }
    setState("saved");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section aria-labelledby="rates-h" className="card space-y-5 p-5 sm:p-6">
        <div>
          <h2 id="rates-h" className="text-lg font-semibold">
            Gold rates (₹ per 10 g)
          </h2>
          <p className="text-sm text-muted">Last updated {formatLongDate(jeweller.rateUpdatedAt)}.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField id="r22" label="22K rate" value={v.rate22k} onChange={set("rate22k")} suffix="/ 10g" />
          <NumberField
            id="ibja"
            label="IBJA benchmark (22K)"
            value={v.ibjaRate22k}
            onChange={set("ibjaRate22k")}
            suffix="/ 10g"
            hint={n("rate22k") > 0 && n("ibjaRate22k") > 0 ? `Your rate is ${formatDiff(n("rate22k"), n("ibjaRate22k"))} vs IBJA` : undefined}
          />
          <NumberField id="r24" label="24K rate" value={v.rate24k} onChange={set("rate24k")} suffix="/ 10g" hint="Default: 22K × 24/22" />
          <NumberField id="r18" label="18K rate" value={v.rate18k} onChange={set("rate18k")} suffix="/ 10g" hint="Default: 22K × 18/22" />
        </div>
        <button
          type="button"
          className="text-sm font-medium text-forest underline underline-offset-4"
          onClick={() => {
            const d = derivedRates(n("rate22k"));
            setState("idle");
            setV((cur) => ({ ...cur, rate24k: String(d.rate24k), rate18k: String(d.rate18k) }));
          }}
        >
          Recalculate 24K and 18K from 22K
        </button>
      </section>

      <section aria-labelledby="defaults-h" className="card space-y-5 p-5 sm:p-6">
        <h2 id="defaults-h" className="text-lg font-semibold">
          Quote defaults
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField id="mk" label="Making charges" value={v.defaultMakingPct} onChange={set("defaultMakingPct")} suffix="%" />
          <NumberField id="ws" label="Wastage" value={v.defaultWastagePct} onChange={set("defaultWastagePct")} suffix="%" />
          <NumberField id="gst" label="GST" value={v.defaultGstPct} onChange={set("defaultGstPct")} suffix="%" />
          <NumberField id="ld" label="Rate lock" value={v.rateLockDays} onChange={set("rateLockDays")} suffix="days" />
          <NumberField id="adv" label="Advance to lock" value={v.rateLockAdvancePct} onChange={set("rateLockAdvancePct")} suffix="%" />
        </div>
      </section>

      {[...check.errors, ...check.warnings, ...(error ? [error] : [])].map((m) => (
        <p key={m} role="alert" className="font-medium text-up">
          {m}
        </p>
      ))}
      <div className="flex items-center gap-4">
        <button className="btn" disabled={state === "saving" || check.errors.length > 0}>
          {state === "saving" ? "Saving…" : "Save settings"}
        </button>
        {state === "saved" && (
          <span role="status" className="text-sm font-medium text-down">
            Saved. New quotes will use these rates.
          </span>
        )}
      </div>
    </form>
  );
}
