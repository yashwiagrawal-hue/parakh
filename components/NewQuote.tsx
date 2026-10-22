"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CopyButton from "./CopyButton";
import DesignPreview from "./DesignPreview";
import { designs, findDesign, jeweller } from "@/lib/catalogue";
import { checkRates } from "@/lib/checks";
import type { Enquiry } from "@/lib/enquiry";
import {
  PURITIES,
  computeQuote,
  formatGap,
  formatPaise,
  formatRupees,
  perGramRange,
  type Making,
  type PricingInput,
  type Purity,
} from "@/lib/pricing";
import { useRates } from "@/lib/rates";

type Tab = "picker" | "enquiry";

interface CustomDraft {
  item: string;
  purity: Purity | "";
  weightMin: string;
  weightMax: string;
  size: string;
  stones: string;
}

interface StoneRow {
  label: string;
  price: string;
}

const EMPTY_DRAFT: CustomDraft = { item: "", purity: "", weightMin: "", weightMax: "", size: "", stones: "" };
const ITEMS = ["ring", "bangle", "chain", "necklace", "earrings", "pendant", "other"];
const CUSTOM_MAKING_PCT = 12;
const CUSTOM_WASTAGE_PCT = 4;

const toNum = (v: string) => (v.trim() === "" ? NaN : Number(v));

export default function NewQuote() {
  const { rates, ready } = useRates();
  const [tab, setTab] = useState<Tab>("picker");

  // Design picker
  const [designId, setDesignId] = useState(designs[0]!.id);
  const [purity, setPurity] = useState<Purity>("22K");
  const [sizeLabel, setSizeLabel] = useState(designs[0]!.sizes["22K"][0]!.label);

  // Pasted enquiry
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomDraft | null>(null);
  const [enquiryNote, setEnquiryNote] = useState<string | null>(null);
  const [enquiryMissing, setEnquiryMissing] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState<CustomDraft | null>(null);

  // Charges
  const first = designs[0]!;
  const [makingType, setMakingType] = useState<Making["type"]>("percent");
  const [makingValue, setMakingValue] = useState(String(first.defaultMakingPct));
  const [wastage, setWastage] = useState(String(first.defaultWastagePct));
  const [stones, setStones] = useState<StoneRow[]>(
    first.defaultStones.map((s) => ({ label: s.label, price: String(s.priceRupees) })),
  );
  const [lockDays, setLockDays] = useState(jeweller.defaultLockDays);
  const [customerName, setCustomerName] = useState("");

  // Approval
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; message: string } | null>(null);

  const design = findDesign(designId)!;

  function applyDesignDefaults(id: string) {
    const d = findDesign(id)!;
    setMakingType("percent");
    setMakingValue(String(d.defaultMakingPct));
    setWastage(String(d.defaultWastagePct));
    setStones(d.defaultStones.map((s) => ({ label: s.label, price: String(s.priceRupees) })));
  }

  function pickDesign(id: string) {
    const d = findDesign(id)!;
    setDesignId(id);
    setSizeLabel(d.sizes[purity].find((s) => s.label === sizeLabel)?.label ?? d.sizes[purity][0]!.label);
    applyDesignDefaults(id);
    setCreated(null);
  }

  function pickPurity(p: Purity) {
    setPurity(p);
    setSizeLabel(design.sizes[p].find((s) => s.label === sizeLabel)?.label ?? design.sizes[p][0]!.label);
    setCreated(null);
  }

  function switchTab(next: Tab) {
    setTab(next);
    setCreated(null);
    if (next === "picker") applyDesignDefaults(designId);
    else {
      setMakingType("percent");
      setMakingValue(String(CUSTOM_MAKING_PCT));
      setWastage(String(CUSTOM_WASTAGE_PCT));
      setStones([]);
    }
  }

  async function readEnquiry() {
    setReading(true);
    setReadError(null);
    setConfirmed(null);
    try {
      const res = await fetch("/api/parse-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("bad response");
      const e = (await res.json()) as Enquiry;
      setDraft({
        item: e.item ?? "",
        purity: e.purity ?? "",
        weightMin: e.weightMinG === null ? "" : String(e.weightMinG),
        weightMax: e.weightMaxG === null ? "" : String(e.weightMaxG),
        size: e.size ?? "",
        stones: e.stones.map((s) => s.label).join(", "),
      });
      setEnquiryNote(e.notes);
      setEnquiryMissing(e.missing);
    } catch {
      setReadError("Couldn't read this enquiry. Fill the fields yourself.");
      setDraft(EMPTY_DRAFT);
      setEnquiryNote(null);
      setEnquiryMissing([]);
    } finally {
      setReading(false);
    }
  }

  const draftWeightsOk =
    draft !== null &&
    toNum(draft.weightMin) > 0 &&
    toNum(draft.weightMax) >= toNum(draft.weightMin) &&
    draft.purity !== "";

  // What the price section is about: a catalogue design, or a confirmed enquiry.
  const spec = useMemo(() => {
    if (tab === "picker") {
      const size = design.sizes[purity].find((s) => s.label === sizeLabel) ?? design.sizes[purity][0]!;
      return {
        name: design.name,
        image: design.image,
        demo: design.demo,
        purity,
        sizeText: `${design.sizeLabel} ${size.label}`,
        sizeLabel: size.label,
        weightMinG: size.weightMinG,
        weightMaxG: size.weightMaxG,
      };
    }
    if (!confirmed || confirmed.purity === "") return null;
    return {
      name: confirmed.item ? `Custom ${confirmed.item}` : "Custom piece",
      image: null as string | null,
      demo: false,
      purity: confirmed.purity,
      sizeText: confirmed.size ? `Size ${confirmed.size}` : "",
      sizeLabel: confirmed.size || null,
      weightMinG: toNum(confirmed.weightMin),
      weightMaxG: toNum(confirmed.weightMax),
    };
  }, [tab, design, purity, sizeLabel, confirmed]);

  const makingNum = toNum(makingValue);
  const wastageNum = toNum(wastage);
  const stoneRows = stones.filter((s) => s.label.trim() !== "" || s.price.trim() !== "");
  const stonesOk = stoneRows.every((s) => s.label.trim() !== "" && toNum(s.price) >= 0);

  const input: PricingInput | null = useMemo(() => {
    if (!spec || !ready) return null;
    if (!(spec.weightMinG > 0) || !(spec.weightMaxG >= spec.weightMinG)) return null;
    if (!(makingNum >= 0) || !(wastageNum >= 0) || !stonesOk) return null;
    const making: Making =
      makingType === "percent" ? { type: "percent", value: makingNum / 100 } : { type: makingType, value: makingNum };
    return {
      weightMinG: spec.weightMinG,
      weightMaxG: spec.weightMaxG,
      purity: spec.purity,
      ratePerG: rates.ratePerG[spec.purity],
      ibjaRatePerG: rates.ibjaRatePerG[spec.purity],
      making,
      wastagePct: wastageNum / 100,
      stones: stoneRows.map((s) => ({ label: s.label.trim(), priceRupees: toNum(s.price) })),
      lockDays,
      lockTable: jeweller.lockTable,
    };
  }, [spec, ready, makingType, makingNum, wastageNum, stonesOk, stoneRows, rates, lockDays]);

  const check = useMemo(
    () =>
      input
        ? checkRates({
            ratePerG: input.ratePerG,
            ibjaRatePerG: input.ibjaRatePerG,
            ibjaDate: rates.ibjaDate,
          })
        : { errors: [], warnings: [] },
    [input, rates.ibjaDate],
  );
  const result = input ? computeQuote(input) : null;
  const canApprove = !!input && !!result && check.errors.length === 0 && !approving;

  async function approve() {
    if (!input || !spec) return;
    setApproving(true);
    setApproveError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: tab === "picker" ? designId : null,
          item: tab === "picker" ? design.item : confirmed?.item || null,
          sizeLabel: spec.sizeLabel,
          purity: input.purity,
          weightMinG: input.weightMinG,
          weightMaxG: input.weightMaxG,
          ratePerG: input.ratePerG,
          ibjaRatePerG: input.ibjaRatePerG,
          ibjaDate: rates.ibjaDate,
          ibjaSession: rates.ibjaSession,
          making: input.making,
          wastagePct: input.wastagePct,
          stones: input.stones,
          lockDays: input.lockDays,
          customerFirstName: customerName.trim() || null,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setApproveError(data.error ?? "The quote could not be created. Check the fields and try again.");
        return;
      }
      const q = await fetch(`/api/quotes/${data.id}`).then((r) => r.json());
      const { whatsappMessage } = await import("@/lib/whatsapp");
      setCreated({ id: data.id, message: whatsappMessage(q, `${window.location.origin}/q/${data.id}`) });
    } catch {
      setApproveError("The quote could not be created. Check your connection and try again.");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New quote</h1>

      <div role="group" aria-label="How to start" className="flex gap-2">
        <button className="chip" aria-pressed={tab === "picker"} onClick={() => switchTab("picker")}>
          Pick a design
        </button>
        <button className="chip" aria-pressed={tab === "enquiry"} onClick={() => switchTab("enquiry")}>
          Paste an enquiry
        </button>
      </div>

      {!rates.savedAt && ready && (
        <p role="status" className="card text-sm text-warn">
          You are using demo rates.{" "}
          <Link href="/" className="underline">
            Set today&apos;s rates
          </Link>{" "}
          before approving a real quote.
        </p>
      )}

      {tab === "picker" ? (
        <section aria-label="Design picker" className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <fieldset>
              <legend className="label">Design</legend>
              <div className="grid grid-cols-2 gap-2">
                {designs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={d.id === designId}
                    onClick={() => pickDesign(d.id)}
                    className="rounded-xl border border-line p-2 text-left text-sm aria-pressed:border-gold aria-pressed:bg-card aria-pressed:ring-2 aria-pressed:ring-gold"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.image} alt="" className="mx-auto h-16 w-16 object-contain" />
                    <span className="mt-1 block font-medium">{d.name}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">Purity</legend>
              <div className="flex gap-2">
                {PURITIES.map((p) => (
                  <button key={p} className="chip" aria-pressed={p === purity} onClick={() => pickPurity(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">{design.sizeLabel}</legend>
              <div className="flex flex-wrap gap-2">
                {design.sizes[purity].map((s) => (
                  <button
                    key={s.label}
                    className="chip"
                    aria-pressed={s.label === sizeLabel}
                    onClick={() => {
                      setSizeLabel(s.label);
                      setCreated(null);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="space-y-3">
            <DesignPreview image={design.image} name={design.name} demo={design.demo} />
            {spec && (
              <p className="text-center text-lg font-semibold" aria-live="polite">
                {spec.weightMinG} to {spec.weightMaxG} g
              </p>
            )}
          </div>
        </section>
      ) : (
        <section aria-label="Paste an enquiry" className="space-y-4">
          <div>
            <label className="label" htmlFor="enquiry-text">
              Paste the WhatsApp enquiry (text only)
            </label>
            <textarea
              id="enquiry-text"
              className="field min-h-28"
              value={text}
              maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Need a 22k bangle around 15-18 gm, size 2.4"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn" disabled={!text.trim() || reading} onClick={readEnquiry}>
              {reading ? "Reading..." : "Read enquiry"}
            </button>
            <button
              className="btn-quiet"
              onClick={() => {
                setDraft(EMPTY_DRAFT);
                setReadError(null);
                setEnquiryNote(null);
                setEnquiryMissing([]);
                setConfirmed(null);
              }}
            >
              Fill fields myself
            </button>
          </div>
          {readError && (
            <p role="alert" className="text-danger">
              {readError}
            </p>
          )}

          {draft && (
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold">Confirm the details</h2>
              <p className="text-sm text-muted">
                Nothing is priced until you confirm. Blank fields were not clear in the message.
              </p>
              {enquiryNote && <p className="text-sm text-warn">{enquiryNote}</p>}
              {enquiryMissing.length > 0 && (
                <p className="text-sm text-warn">Not found in the message: {enquiryMissing.join(", ")}.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="c-item">
                    Item
                  </label>
                  <select
                    id="c-item"
                    className="field"
                    value={draft.item}
                    onChange={(e) => setDraft({ ...draft, item: e.target.value })}
                  >
                    <option value="">Not sure</option>
                    {ITEMS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="c-purity">
                    Purity
                  </label>
                  <select
                    id="c-purity"
                    className="field"
                    value={draft.purity}
                    onChange={(e) => setDraft({ ...draft, purity: e.target.value as Purity | "" })}
                  >
                    <option value="">Not sure</option>
                    {PURITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="c-wmin">
                    Weight from (g)
                  </label>
                  <input
                    id="c-wmin"
                    className="field"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={draft.weightMin}
                    onChange={(e) => setDraft({ ...draft, weightMin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="c-wmax">
                    Weight to (g)
                  </label>
                  <input
                    id="c-wmax"
                    className="field"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={draft.weightMax}
                    onChange={(e) => setDraft({ ...draft, weightMax: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label" htmlFor="c-size">
                    Size (optional)
                  </label>
                  <input
                    id="c-size"
                    className="field"
                    value={draft.size}
                    onChange={(e) => setDraft({ ...draft, size: e.target.value })}
                  />
                </div>
              </div>
              {draft.stones && (
                <p className="text-sm text-muted">
                  Stones mentioned: {draft.stones}. Add them with a price in the charges below if needed.
                </p>
              )}
              <button
                className="btn"
                disabled={!draftWeightsOk}
                onClick={() => {
                  setConfirmed(draft);
                  setCreated(null);
                }}
              >
                Confirm and show price
              </button>
              {!draftWeightsOk && (
                <p className="text-sm text-muted">Choose a purity and a weight range to continue.</p>
              )}
            </div>
          )}
        </section>
      )}

      {spec && (
        <section aria-label="Price" className="card space-y-5">
          <div>
            <h2 className="text-xl font-semibold">{spec.name}</h2>
            <p className="text-muted">
              {spec.purity}
              {spec.sizeText ? ` · ${spec.sizeText}` : ""} · {spec.weightMinG} to {spec.weightMaxG} g
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="making-type">
                Making charge
              </label>
              <select
                id="making-type"
                className="field"
                value={makingType}
                onChange={(e) => {
                  setMakingType(e.target.value as Making["type"]);
                  setCreated(null);
                }}
              >
                <option value="percent">% of gold value</option>
                <option value="perGram">₹ per gram</option>
                <option value="flat">Flat ₹</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="making-value">
                {makingType === "percent" ? "Making (%)" : makingType === "perGram" ? "Making (₹/g)" : "Making (₹)"}
              </label>
              <input
                id="making-value"
                className="field"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={makingValue}
                onChange={(e) => {
                  setMakingValue(e.target.value);
                  setCreated(null);
                }}
              />
            </div>
            <div>
              <label className="label" htmlFor="wastage">
                Wastage (%)
              </label>
              <input
                id="wastage"
                className="field"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={wastage}
                onChange={(e) => {
                  setWastage(e.target.value);
                  setCreated(null);
                }}
              />
            </div>
            <div>
              <label className="label" htmlFor="lock">
                Rate lock
              </label>
              <select
                id="lock"
                className="field"
                value={lockDays}
                onChange={(e) => {
                  setLockDays(Number(e.target.value));
                  setCreated(null);
                }}
              >
                {Object.entries(jeweller.lockTable).map(([days, share]) => (
                  <option key={days} value={days}>
                    {days} days · {Math.round(share * 100)}% advance
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="label mb-0">Stones</p>
            {stones.length === 0 && <p className="text-sm text-muted">No stones.</p>}
            {stones.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label={`Stone ${i + 1} name`}
                  className="field"
                  value={s.label}
                  onChange={(e) => setStones(stones.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                />
                <input
                  aria-label={`Stone ${i + 1} price in rupees`}
                  className="field max-w-32"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={s.price}
                  onChange={(e) => setStones(stones.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                />
                <button
                  className="btn-quiet"
                  aria-label={`Remove stone ${i + 1}`}
                  onClick={() => setStones(stones.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button className="btn-quiet" onClick={() => setStones([...stones, { label: "", price: "" }])}>
              Add a stone
            </button>
          </div>

          <div>
            <label className="label" htmlFor="cust">
              Customer first name (optional)
            </label>
            <input
              id="cust"
              className="field"
              maxLength={30}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {result && input ? (
            <div className="space-y-3 border-t border-line pt-4" aria-live="polite">
              <p className="text-sm text-muted">Price range, all-in with GST</p>
              <p className="text-3xl font-bold">
                {formatPaise(result.min.total)} to {formatPaise(result.max.total)}
              </p>
              <p className="text-muted">
                About {formatPaise(perGramRange(result)[0])} to {formatPaise(perGramRange(result)[1])} per gram, all-in
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted">Your rate ({input.purity})</dt>
                <dd className="text-right">{formatRupees(input.ratePerG)}/g</dd>
                <dt className="text-muted">IBJA rate</dt>
                <dd className="text-right">{formatRupees(input.ibjaRatePerG)}/g</dd>
                <dt className="text-muted">Gap</dt>
                <dd className="text-right">{formatGap(result.ibjaGapPct)}</dd>
                <dt className="text-muted">Advance for {input.lockDays}-day lock</dt>
                <dd className="text-right">{formatPaise(result.advance)}</dd>
              </dl>
            </div>
          ) : (
            <p className="border-t border-line pt-4 text-muted">
              Enter a valid making charge, wastage and stone prices to see the price.
            </p>
          )}

          {check.errors.map((e) => (
            <p key={e} role="alert" className="text-danger">
              {e}{" "}
              <Link href="/" className="underline">
                Fix rates
              </Link>
            </p>
          ))}
          {check.warnings.map((w) => (
            <p key={w} role="status" className="text-sm text-warn">
              {w}
            </p>
          ))}
          {approveError && (
            <p role="alert" className="text-danger">
              {approveError}
            </p>
          )}

          {created ? (
            <div className="space-y-3 rounded-xl border border-ok p-4">
              <p className="font-semibold text-ok">Approved. The quote link is live.</p>
              <p className="break-all text-sm" data-testid="quote-link">
                /q/{created.id}
              </p>
              <pre className="whitespace-pre-wrap rounded-lg bg-bg p-3 text-sm">{created.message}</pre>
              <div className="flex flex-wrap items-center gap-3">
                <CopyButton label="Copy for WhatsApp" getText={() => created.message} />
                <Link href={`/q/${created.id}`} className="btn-quiet">
                  Open quote page
                </Link>
              </div>
            </div>
          ) : (
            <button className="btn w-full" disabled={!canApprove} onClick={approve}>
              {approving ? "Creating link..." : "Approve and create link"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
