"use client";

import {
  ArrowRight,
  Check,
  Copy,
  ImageIcon,
  MessageCircle,
  Mic,
  MicOff,
  Paperclip,
  PenLine,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import PriceBreakdown from "@/components/PriceBreakdown";
import Logo from "@/components/Logo";
import { checkRates } from "@/lib/checks";
import { formatWeightRange } from "@/lib/format";
import { parseEnquiry } from "@/lib/parseEnquiry";
import { computeQuote, validateSpec, type InputErrors } from "@/lib/pricing";
import { pieceName } from "@/lib/quotes";
import { quoteMessage, whatsappUrl } from "@/lib/whatsapp";
import { CATEGORIES, PURITIES, type Category, type Design, type Jeweller, type Purity } from "@/lib/types";
import Stepper from "./Stepper";

/* ---------- Single client store for the whole wizard: going back never loses data ---------- */

interface State {
  step: number;
  maxStep: number;
  enquiryText: string;
  photoUrl: string | null;
  customerName: string;
  customerPhone: string;
  designId: string | null; // null = Custom / Other
  category: Category;
  purity: Purity;
  weightMin: string;
  weightMax: string;
  makingPct: string;
  wastagePct: string;
  stones: string;
  parsedMissing: string[];
  slug: string | null;
}

type Action =
  | { type: "set"; patch: Partial<State> }
  | { type: "go"; step: number };

function reducer(s: State, a: Action): State {
  if (a.type === "go") return { ...s, step: a.step, maxStep: Math.max(s.maxStep, a.step) };
  return { ...s, ...a.patch };
}

const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

export default function QuoteWizard({ jeweller, designs }: { jeweller: Jeweller; designs: Design[] }) {
  const router = useRouter();
  const [s, dispatch] = useReducer(reducer, {
    step: 1,
    maxStep: 1,
    enquiryText: "",
    photoUrl: null,
    customerName: "",
    customerPhone: "",
    designId: designs[0]?.id ?? null,
    category: designs[0]?.category ?? "Ring",
    purity: "22K",
    weightMin: "",
    weightMax: "",
    makingPct: String(jeweller.defaultMakingPct),
    wastagePct: String(jeweller.defaultWastagePct),
    stones: "0",
    parsedMissing: [],
    slug: null,
  });
  const set = (patch: Partial<State>) => dispatch({ type: "set", patch });
  const go = (step: number) => {
    dispatch({ type: "go", step });
    window.scrollTo({ top: 0 });
  };

  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), [s.step]);

  const spec = {
    weightMin: num(s.weightMin),
    weightMax: num(s.weightMax),
    makingPct: num(s.makingPct),
    wastagePct: num(s.wastagePct),
    stones: num(s.stones || "0"),
  };
  const rate = s.purity === "24K" ? jeweller.rate24k : s.purity === "18K" ? jeweller.rate18k : jeweller.rate22k;
  const ibja = s.purity === "24K" ? Math.round((jeweller.ibjaRate22k * 24) / 22) : s.purity === "18K" ? Math.round((jeweller.ibjaRate22k * 18) / 22) : jeweller.ibjaRate22k;
  const design = designs.find((d) => d.id === s.designId);

  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-line bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-8">
          <Logo href="/dashboard" className="hidden text-2xl sm:block" />
          <div className="mx-auto">
            <Stepper step={s.step} maxStep={s.maxStep} locked={!!s.slug} onGo={go} />
          </div>
          <Link href="/dashboard" className="rounded-lg p-2 text-muted hover:text-ink" aria-label="Close and go to dashboard">
            <X aria-hidden size={20} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        {s.step === 1 && (
          <StepDetails
            s={s}
            set={set}
            headingRef={headingRef}
            onNext={() => {
              const p = parseEnquiry(s.enquiryText);
              const patch: Partial<State> = { parsedMissing: p.missing };
              if (p.purity) patch.purity = p.purity;
              if (p.weightMin !== null && p.weightMax !== null) {
                patch.weightMin = String(p.weightMin);
                patch.weightMax = String(p.weightMax);
              }
              if (p.category) {
                const match = designs.find((d) => d.category === p.category);
                patch.category = p.category;
                patch.designId = match?.id ?? null;
              }
              set(patch);
              go(2);
            }}
          />
        )}
        {s.step === 2 && (
          <StepDesign s={s} set={set} designs={designs} headingRef={headingRef} spec={spec} onNext={() => go(3)} />
        )}
        {s.step === 3 && (
          <StepReview
            s={s}
            jeweller={jeweller}
            design={design}
            rate={rate}
            ibja={ibja}
            spec={spec}
            headingRef={headingRef}
            onEdit={() => go(2)}
            onCreated={(slug) => {
              set({ slug });
              go(4);
              router.refresh();
            }}
          />
        )}
        {s.step === 4 && s.slug && (
          <StepSend
            s={s}
            jeweller={jeweller}
            designName={pieceName(design?.category ?? s.category)}
            breakdown={computeQuote({ ratePer10g: rate, ...spec, gstPct: jeweller.defaultGstPct })}
            headingRef={headingRef}
          />
        )}
      </main>
    </div>
  );
}

type HeadingRef = React.RefObject<HTMLHeadingElement>;

/* ---------- Step 1: Enter Enquiry Details ---------- */

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function StepDetails({ s, set, onNext, headingRef }: { s: State; set: (p: Partial<State>) => void; onNext: () => void; headingRef: HeadingRef }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setSpeechSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as Record<string, new () => SpeechRecognitionLike>;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0]?.transcript ?? "").join(" ");
      set({ enquiryText: `${s.enquiryText}${s.enquiryText ? " " : ""}${text}`.trim() });
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setUploading(false);
    if (!res?.ok || !data?.url) {
      setUploadError(data?.error ?? "The photo could not be uploaded. Try again.");
      return;
    }
    set({ photoUrl: data.url });
  }

  const time = useMemo(() => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date()), []);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
      >
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="font-serif text-3xl outline-none sm:text-[2.1rem]">
            Enter Enquiry Details
          </h1>
          <p className="mt-1.5 text-muted">Paste the customer&apos;s WhatsApp message, or enter manually.</p>
        </div>

        <div className="rounded-card border border-line bg-surface shadow-soft focus-within:border-forest">
          <label htmlFor="enquiry" className="sr-only">
            Customer&apos;s message
          </label>
          <textarea
            id="enquiry"
            rows={6}
            maxLength={2000}
            value={s.enquiryText}
            onChange={(e) => set({ enquiryText: e.target.value })}
            placeholder={"Example:\nHi, I want a 5 gram ring with a floral design in 22K gold.\nPlease Share the Quotation."}
            className="block w-full resize-y rounded-t-card bg-transparent px-4 py-3.5 text-base outline-none placeholder:text-muted/70"
          />
          <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              id="photo"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            <label htmlFor="photo" className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:text-ink">
              <Paperclip aria-hidden size={17} /> {uploading ? "Uploading…" : s.photoUrl ? "Change photo" : "Add photo (optional)"}
            </label>
            <button
              type="button"
              onClick={toggleMic}
              disabled={!speechSupported}
              aria-pressed={listening}
              aria-label={listening ? "Stop voice input" : "Speak the enquiry"}
              title={speechSupported ? undefined : "Voice input isn't supported in this browser"}
              className={`rounded-lg p-2 ${listening ? "bg-up/10 text-up" : "text-muted hover:text-ink"} disabled:opacity-40`}
            >
              {listening ? <MicOff aria-hidden size={18} /> : <Mic aria-hidden size={18} />}
            </button>
          </div>
        </div>
        {uploadError && (
          <p role="alert" className="text-sm font-medium text-up">
            {uploadError}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cname">
              Customer name
            </label>
            <input id="cname" className="field" autoComplete="off" value={s.customerName} onChange={(e) => set({ customerName: e.target.value })} placeholder="e.g. Riya Shah" maxLength={60} />
          </div>
          <div>
            <label className="label" htmlFor="cphone">
              WhatsApp number
            </label>
            <input id="cphone" className="field tnum" type="tel" inputMode="tel" autoComplete="off" value={s.customerPhone} onChange={(e) => set({ customerPhone: e.target.value.replace(/[^\d+\s()-]/g, "") })} placeholder="e.g. 98200 12345" maxLength={20} />
          </div>
        </div>

        <button className="btn">
          Generate Quote <ArrowRight aria-hidden size={18} />
        </button>
      </form>

      <aside aria-label="WhatsApp preview" className="relative hidden rounded-[18px] border border-line bg-[#EFE7DA] p-5 lg:block">
        <span className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#25A85A] text-white shadow-lift" aria-hidden>
          <MessageCircle size={22} fill="currentColor" strokeWidth={1.5} />
        </span>
        <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-[#DDF3D1] px-3.5 py-2.5 text-[0.95rem] text-[#1F2A24] shadow-sm">
          <p className="whitespace-pre-wrap break-words">
            {s.enquiryText.trim() || "Hi, I want a 5 gram ring with a floral design in 22K gold. Please Share the Quotation."}
          </p>
          <p className="mt-1 text-right text-[0.7rem] text-[#1F2A24]/60">{time} ✓✓</p>
        </div>
        <div className="ml-auto mt-3 max-w-[85%] overflow-hidden rounded-xl bg-[#DDF3D1] p-1.5 shadow-sm">
          {s.photoUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.photoUrl} alt="Reference photo from the customer" className="aspect-[4/3] w-full rounded-lg object-cover" />
              <button type="button" onClick={() => set({ photoUrl: null })} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-[#1F2A24]" aria-label="Remove photo">
                <Trash2 aria-hidden size={15} />
              </button>
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg bg-white/60 text-sm text-[#1F2A24]/60">
              <ImageIcon aria-hidden size={28} strokeWidth={1.4} />
              Reference photo appears here
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ---------- Step 2: Select Design & Specifications ---------- */

function StepDesign({
  s,
  set,
  designs,
  spec,
  onNext,
  headingRef,
}: {
  s: State;
  set: (p: Partial<State>) => void;
  designs: Design[];
  spec: { weightMin: number; weightMax: number; makingPct: number; wastagePct: number; stones: number };
  onNext: () => void;
  headingRef: HeadingRef;
}) {
  const [errors, setErrors] = useState<InputErrors>({});
  const custom = s.designId === null;

  return (
    <form
      className="grid gap-8 lg:grid-cols-[1.4fr_1fr]"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const errs = validateSpec(spec);
        setErrors(errs);
        if (Object.keys(errs).length === 0) onNext();
      }}
    >
      <div className="space-y-5">
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="font-serif text-3xl outline-none sm:text-[2.1rem]">
            Select Design &amp; Specifications
          </h1>
          {s.parsedMissing.length > 0 && s.enquiryText.trim() && (
            <p className="mt-1.5 text-sm text-gold-ink">
              Not found in the message: {s.parsedMissing.join(", ")}. Please fill these in.
            </p>
          )}
        </div>
        <fieldset>
          <legend className="label">Design Category</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {designs.map((d) => {
              const selected = d.id === s.designId;
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    const patch: Partial<State> = { designId: d.id, category: d.category };
                    if (!s.weightMin && !s.weightMax) {
                      patch.weightMin = String(d.typicalWeightMin);
                      patch.weightMax = String(d.typicalWeightMax);
                    }
                    set(patch);
                  }}
                  className={`rounded-xl border-2 bg-surface p-1.5 text-center text-sm transition ${
                    selected ? "border-forest shadow-soft" : "border-line hover:border-forest/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.thumbUrl} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  <span className={`mt-1.5 block pb-1 ${selected ? "font-semibold text-forest" : ""}`}>{d.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={custom}
              onClick={() => set({ designId: null })}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 bg-surface p-3 text-sm transition ${
                custom ? "border-forest font-semibold text-forest shadow-soft" : "border-dashed border-line text-muted hover:border-forest/50"
              }`}
            >
              <PenLine aria-hidden size={26} strokeWidth={1.5} />
              Custom / Other
            </button>
          </div>
        </fieldset>
        {custom && (
          <div className="max-w-xs">
            <label className="label" htmlFor="category">
              What kind of piece?
            </label>
            <select id="category" className="field" value={s.category} onChange={(e) => set({ category: e.target.value as Category })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "Custom/Other" ? "Other" : c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card h-fit space-y-5 p-5 sm:p-6">
        <fieldset>
          <legend className="label">Estimated Weight Range</legend>
          <div className="flex items-center gap-2">
            <label htmlFor="wmin" className="sr-only">
              Minimum weight in grams
            </label>
            <input id="wmin" className="field tnum" type="number" inputMode="decimal" min="0" step="any" value={s.weightMin} onChange={(e) => set({ weightMin: e.target.value })} aria-invalid={!!errors.weight} aria-describedby={errors.weight ? "w-err" : undefined} />
            <span aria-hidden className="text-muted">–</span>
            <label htmlFor="wmax" className="sr-only">
              Maximum weight in grams
            </label>
            <input id="wmax" className="field tnum" type="number" inputMode="decimal" min="0" step="any" value={s.weightMax} onChange={(e) => set({ weightMax: e.target.value })} aria-invalid={!!errors.weight} aria-describedby={errors.weight ? "w-err" : undefined} />
            <span className="text-sm text-muted">grams</span>
          </div>
          {errors.weight && (
            <p id="w-err" className="mt-1.5 text-sm text-up">
              {errors.weight}
            </p>
          )}
        </fieldset>

        <div>
          <label className="label" htmlFor="purity">
            Gold Purity
          </label>
          <select id="purity" className="field" value={s.purity} onChange={(e) => set({ purity: e.target.value as Purity })}>
            {PURITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        <PercentField id="making" label="Making Charges (%)" value={s.makingPct} onChange={(v) => set({ makingPct: v })} error={errors.making} suffix="%" />
        <PercentField id="wastage" label="Wastage (%)" value={s.wastagePct} onChange={(v) => set({ wastagePct: v })} error={errors.wastage} suffix="%" />
        <PercentField id="stones" label="Stone charges (₹)" value={s.stones} onChange={(v) => set({ stones: v })} error={errors.stones} suffix="₹" />

        <button className="btn w-full">
          Continue <ArrowRight aria-hidden size={18} />
        </button>
      </div>
    </form>
  );
}

function PercentField({ id, label, value, onChange, error, suffix }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; suffix: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input id={id} className="field tnum pr-10" type="number" inputMode="decimal" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
        <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
          {suffix}
        </span>
      </div>
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-up">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- Step 3: Quote Preview ---------- */

function StepReview({
  s,
  jeweller,
  design,
  rate,
  ibja,
  spec,
  onEdit,
  onCreated,
  headingRef,
}: {
  s: State;
  jeweller: Jeweller;
  design: Design | undefined;
  rate: number;
  ibja: number;
  spec: { weightMin: number; weightMax: number; makingPct: number; wastagePct: number; stones: number };
  onEdit: () => void;
  onCreated: (slug: string) => void;
  headingRef: HeadingRef;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const breakdown = computeQuote({ ratePer10g: rate, ...spec, gstPct: jeweller.defaultGstPct });
  const check = checkRates({ ratePer10g: jeweller.rate22k, ibjaPer10g: jeweller.ibjaRate22k, rateUpdatedAt: jeweller.rateUpdatedAt });
  const name = pieceName(design?.category ?? s.category);

  async function confirm() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: s.customerName.trim() || null,
        customerPhone: s.customerPhone.trim() || null,
        enquiryText: s.enquiryText.trim() || null,
        referencePhotoUrl: s.photoUrl,
        designId: s.designId,
        category: s.designId ? design?.category : s.category,
        purity: s.purity,
        ...spec,
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setSaving(false);
    if (!res?.ok || !data?.slug) {
      setError(data?.error ?? "The quote could not be created. Check your connection and try again.");
      return;
    }
    onCreated(data.slug);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="font-serif text-3xl outline-none sm:text-[2.1rem]">
            Quote Preview
          </h1>
          <p className="mt-1.5 text-muted">Review the details before sending to customer.</p>
        </div>
        <button type="button" onClick={onEdit} className="btn-outline min-h-0 px-3 py-2 text-sm">
          <Pencil aria-hidden size={15} /> Edit
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <div className="card h-fit overflow-hidden">
          {design ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={design.imageUrl} alt={design.name} className="aspect-[4/3] w-full object-cover" />
          ) : s.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.photoUrl} alt="Customer's reference photo" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-gold-tint text-muted">
              <PenLine aria-hidden size={36} strokeWidth={1.3} />
            </div>
          )}
          <div className="p-4">
            <p className="text-lg font-semibold">{name}</p>
            <p className="tnum text-sm text-muted">
              {s.purity} Gold &nbsp;|&nbsp; Estimated {formatWeightRange(spec.weightMin, spec.weightMax)}
            </p>
            {s.customerName.trim() && <p className="mt-2 text-sm">For {s.customerName.trim()}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <PriceBreakdown
            purity={s.purity}
            rateUsed={rate}
            ibjaRateUsed={ibja}
            breakdown={breakdown}
            makingPct={spec.makingPct}
            wastagePct={spec.wastagePct}
            gstPct={jeweller.defaultGstPct}
            rateLockDays={jeweller.rateLockDays}
            rateLockAdvancePct={jeweller.rateLockAdvancePct}
          />
          {[...check.errors, ...check.warnings].map((m) => (
            <p key={m} role="alert" className="text-sm font-medium text-up">
              {m}{" "}
              <Link href="/settings/rates" className="underline">
                Rate Settings
              </Link>
            </p>
          ))}
          {error && (
            <p role="alert" className="text-sm font-medium text-up">
              {error}
            </p>
          )}
          <button type="button" className="btn w-full" disabled={saving || check.errors.length > 0} onClick={confirm}>
            {saving ? "Creating link…" : "Confirm & Create Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 4: Send on WhatsApp ---------- */

function StepSend({
  s,
  jeweller,
  designName,
  breakdown,
  headingRef,
}: {
  s: State;
  jeweller: Jeweller;
  designName: string;
  breakdown: ReturnType<typeof computeQuote>;
  headingRef: HeadingRef;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/q/${s.slug}`;
  const message = quoteMessage({
    customerName: s.customerName,
    jewellerName: jeweller.name,
    designName,
    purity: s.purity,
    weightMin: num(s.weightMin),
    weightMax: num(s.weightMax),
    breakdown,
    rateLockDays: jeweller.rateLockDays,
    rateLockAdvancePct: jeweller.rateLockAdvancePct,
    url,
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.getElementById("quote-url") as HTMLInputElement | null;
      input?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card relative px-5 pb-6 pt-10 text-center sm:px-8">
        <Link href="/dashboard" className="absolute right-3 top-3 rounded-lg p-2 text-muted hover:text-ink" aria-label="Close and go to dashboard">
          <X aria-hidden size={20} />
        </Link>
        <div className="relative mx-auto mb-5 h-20 w-20">
          {["-left-4 top-2", "-right-3 top-0", "-left-2 bottom-1", "-right-5 bottom-4", "left-1/2 -top-4"].map((pos, i) => (
            <span key={pos} aria-hidden className={`absolute h-1.5 w-1.5 animate-pop rounded-full ${i % 2 ? "bg-gold" : "bg-forest/60"} ${pos}`} style={{ animationDelay: `${200 + i * 60}ms` }} />
          ))}
          <svg viewBox="0 0 80 80" className="h-20 w-20 animate-pop" aria-hidden>
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgb(var(--forest))" strokeWidth="3" />
            <path d="M25 41 l10 10 l20 -22" fill="none" stroke="rgb(var(--forest))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" strokeDashoffset="50" className="animate-draw" />
          </svg>
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl outline-none">
          Quote link ready!
        </h1>
        <p className="mt-1 text-muted">Share this link with your customer on WhatsApp.</p>

        <div className="mt-6 flex gap-2">
          <label htmlFor="quote-url" className="sr-only">
            Quote link
          </label>
          <input id="quote-url" readOnly value={url} onFocus={(e) => e.target.select()} className="field min-w-0 flex-1 bg-ivory text-sm" />
          <button type="button" onClick={copy} className="btn shrink-0 px-4">
            {copied ? <Check aria-hidden size={17} /> : <Copy aria-hidden size={17} />}
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>
        <p role="status" className="sr-only">
          {copied ? "Link copied" : ""}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a href={whatsappUrl(s.customerPhone, message)} target="_blank" rel="noopener noreferrer" className="btn">
            <MessageCircle aria-hidden size={18} /> Send on WhatsApp
          </a>
          <a href={`/q/${s.slug}`} target="_blank" rel="noopener noreferrer" className="btn-outline">
            View Quote
          </a>
        </div>
        {!s.customerPhone.trim() && <p className="mt-3 text-xs text-muted">No phone number added: WhatsApp will ask you to pick the chat.</p>}
        {/* Full page load on purpose: it resets the wizard store for a fresh quote. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/quotes/new" className="mt-5 inline-block text-sm font-medium text-forest underline underline-offset-4">
          Create another quote
        </a>
      </div>
    </div>
  );
}
