"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { checkRates } from "@/lib/checks";
import { formatDiff, formatINR } from "@/lib/format";
import { derivedRates } from "@/lib/pricing";

/** Today's 22K rate vs IBJA, with an "Update Rate" modal. Shop above IBJA shows red, below shows green. */
export default function GoldRateCard({ rate22k, ibjaRate22k }: { rate22k: number; ibjaRate22k: number }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [rate, setRate] = useState(String(rate22k));
  const [ibja, setIbja] = useState(String(ibjaRate22k));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diff = rate22k - ibjaRate22k;
  const check = checkRates({ ratePer10g: Number(rate), ibjaPer10g: Number(ibja) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (check.errors.length) return;
    setSaving(true);
    setError(null);
    const r = Number(rate);
    const res = await fetch("/api/settings/rates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate22k: r, ...derivedRates(r), ibjaRate22k: Number(ibja) }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setError((await res?.json().catch(() => null))?.error ?? "The rate could not be saved. Check your connection and try again.");
      return;
    }
    dialog.current?.close();
    router.refresh();
  }

  return (
    <section aria-label="Today's gold rate" className="rounded-card border border-forest/15 bg-forest-tint p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Today&apos;s Gold Rate (22K)</p>
          <p className="tnum mt-1 text-2xl font-semibold">
            {formatINR(rate22k)} <span className="text-base font-normal text-muted">/ 10g</span>
          </p>
          <p className="tnum mt-1 text-sm text-muted">
            IBJA: {formatINR(ibjaRate22k)}{" "}
            <span className={diff > 0 ? "font-medium text-up" : diff < 0 ? "font-medium text-down" : ""}>
              {formatDiff(rate22k, ibjaRate22k)}
            </span>
          </p>
        </div>
        <button
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold hover:border-forest"
          onClick={() => {
            setRate(String(rate22k));
            setIbja(String(ibjaRate22k));
            setError(null);
            dialog.current?.showModal();
          }}
        >
          Update Rate
        </button>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="rate-dialog-title"
        className="w-[min(26rem,calc(100%-2rem))] rounded-card border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-ink/30"
      >
        <form onSubmit={save} className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 id="rate-dialog-title" className="font-serif text-2xl">
              Update today&apos;s rate
            </h2>
            <button type="button" className="rounded-lg p-1.5" aria-label="Close" onClick={() => dialog.current?.close()}>
              <X size={20} aria-hidden />
            </button>
          </div>
          <div>
            <label className="label" htmlFor="rate22">
              Your 22K rate (₹ per 10 g)
            </label>
            <input id="rate22" className="field tnum" type="number" inputMode="numeric" min="0" step="1" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="ibja22">
              IBJA benchmark 22K (₹ per 10 g)
            </label>
            <input id="ibja22" className="field tnum" type="number" inputMode="numeric" min="0" step="1" value={ibja} onChange={(e) => setIbja(e.target.value)} />
          </div>
          <p className="text-sm text-muted">24K and 18K are recalculated from 22K. Fine-tune them in Rate Settings.</p>
          {[...check.errors, ...(error ? [error] : [])].map((m) => (
            <p key={m} role="alert" className="text-sm font-medium text-up">
              {m}
            </p>
          ))}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-outline" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <button className="btn" disabled={saving || check.errors.length > 0}>
              {saving ? "Saving…" : "Save rate"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
