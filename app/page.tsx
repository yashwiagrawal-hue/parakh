import { Lock, PlayCircle, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { formatINR } from "@/lib/format";
import { priceAt } from "@/lib/pricing";
import { SEED_JEWELLER } from "@/lib/seed";

// The hero card's numbers come from the real pricing engine so they are internally consistent.
const SAMPLE = { weight: 18, making: 9, stones: 8500 };
const sample = priceAt(SAMPLE.weight, {
  ratePer10g: SEED_JEWELLER.rate22k,
  weightMin: SAMPLE.weight,
  weightMax: SAMPLE.weight,
  makingPct: SAMPLE.making,
  wastagePct: 0,
  stones: SAMPLE.stones,
  gstPct: 3,
});

const NAV = ["How it works", "Features", "For Jewellers", "Pricing"];

const FEATURES = [
  { icon: Zap, title: "Save time", text: "No more manual calculations" },
  { icon: ShieldCheck, title: "Build trust", text: "Customers see a clear breakup" },
  { icon: TrendingUp, title: "Reduce risk", text: "Add rate-lock terms" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center gap-6 px-4 py-5 sm:px-8">
        <Logo />
        <nav aria-label="Site" className="ml-10 hidden gap-9 text-sm md:flex">
          {NAV.map((n) => (
            <a key={n} href={`#${n.toLowerCase().replace(/\s+/g, "-")}`} className="text-ink/80 hover:text-ink">
              {n}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link href="/dashboard" className="btn-outline min-h-10 px-4 py-2 text-sm">
            Log in
          </Link>
          <Link href="/dashboard" className="btn min-h-10 px-4 py-2 text-sm">
            Get Started
          </Link>
        </div>
      </header>

      <main>
        {/* Hero: copy on the left; on wide screens a warm photo panel bleeds off the right edge with the quote card over it. */}
        <section className="relative">
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 -top-[76px] hidden w-[46%] overflow-hidden bg-[linear-gradient(160deg,#F1E6D3_0%,#E7D5B7_55%,#D9C19A_100%)] lg:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/photos/hero-ring.jpg"
              alt=""
              className="absolute left-0 top-[60px] h-auto w-full [mask-image:linear-gradient(to_bottom,black_75%,transparent)]"
            />
            <div className="absolute bottom-[6%] left-[8%] h-[34%] w-[70%] rounded-[40%_40%_12px_12px] bg-[linear-gradient(180deg,#EDE0C8,#D8C29D)] opacity-80 blur-[1px]" />
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ivory to-transparent" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-6 sm:px-8 lg:min-h-[600px] lg:grid-cols-[1.3fr_1fr] lg:pb-20 lg:pt-12">
            <div className="lg:pr-4">
              <p className="eyebrow">Fair prices. Happy customers.</p>
              <h1 className="mt-6 font-serif text-[2.5rem] font-normal leading-[1.12] tracking-[-0.01em] sm:text-5xl lg:text-[2.7rem] xl:text-[3.1rem]">
                Turn WhatsApp enquiries <br className="hidden lg:block" />
                into <em className="text-gold-ink">trusted jewellery quotes</em> <br className="hidden lg:block" />
                <em>in under</em> <em className="text-gold-ink">2&nbsp;minutes.</em>
              </h1>
              <p className="mt-7 max-w-md text-lg leading-relaxed text-ink/80">
                Full price breakup, IBJA comparison and written rate-lock terms — all in one link.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/dashboard" className="btn px-7 py-3">
                  Get Started Free
                </Link>
                <a href="#how-it-works" className="btn-outline px-6 py-3">
                  <PlayCircle aria-hidden size={19} strokeWidth={1.75} /> Watch Demo
                </a>
              </div>

              <ul id="features" className="mt-14 grid max-w-xl gap-6 sm:grid-cols-3">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <li key={title}>
                    <Icon aria-hidden size={24} strokeWidth={1.5} className="text-gold-ink" />
                    <p className="mt-3 font-semibold">{title}</p>
                    <p className="text-sm text-muted">{text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative" aria-hidden>
              {/* Phones and tablets: the photo sits above the card instead of bleeding off the edge. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/photos/hero-ring.jpg" alt="" className="aspect-[4/3] w-full rounded-[24px] object-cover object-left shadow-soft lg:hidden" />

              <div className="relative mx-auto -mt-10 w-[min(20rem,88%)] rotate-[-4deg] rounded-2xl border border-white/60 bg-surface/95 p-5 text-ink shadow-lift backdrop-blur sm:w-[21rem] lg:absolute lg:left-[14%] lg:top-[36%] lg:mt-0">
                <p className="font-semibold">Custom Ring Quote</p>
                <dl className="tnum mt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
                    <dt>
                      Gold ({SAMPLE.weight}g)
                      <span className="block text-xs text-muted">{formatINR(SEED_JEWELLER.rate22k)}/10g</span>
                    </dt>
                    <dd>{formatINR(sample.gold)}</dd>
                  </div>
                <div className="flex justify-between gap-4">
                  <dt>Making Charges ({SAMPLE.making}%)</dt>
                  <dd>{formatINR(sample.making)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Stones</dt>
                  <dd>{formatINR(sample.stones)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>GST (3%)</dt>
                  <dd>{formatINR(sample.gst)}</dd>
                </div>
              </dl>
              <div className="tnum mt-3 flex justify-between rounded-lg bg-gold-tint px-3 py-2.5 font-semibold">
                <span>Total Estimate</span>
                <span>{formatINR(sample.total)}</span>
              </div>
              <p className="mt-3 flex items-center gap-2.5 text-sm">
                <Lock size={18} className="shrink-0 text-gold-ink" />
                Rate locked for 7 days on 25% advance
              </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-line bg-surface/60">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
            <h2 className="font-serif text-3xl sm:text-4xl">How it works</h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-4">
              {[
                ["Paste the enquiry", "Drop in the customer's WhatsApp message. Parakh reads the weight, purity and piece."],
                ["Pick the design", "Choose from your catalogue and confirm the weight range and charges."],
                ["Review the price", "See every line: gold, making, stones, GST, and your rate next to IBJA."],
                ["Send the link", "Share one clean link on WhatsApp with written rate-lock terms."],
              ].map(([t, d], i) => (
                <li key={t} className="card p-5">
                  <span className="tnum flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-semibold text-on-forest">{i + 1}</span>
                  <p className="mt-4 font-semibold">{t}</p>
                  <p className="mt-1 text-sm text-muted">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="for-jewellers" className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <div className="card flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="pricing" className="font-serif text-3xl">Free while in early access</h2>
              <p className="mt-2 max-w-xl text-muted">Built for small jewellers who quote on WhatsApp every day. No card needed.</p>
            </div>
            <Link href="/dashboard" className="btn px-6 py-3">
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-8">
          <span className="font-serif text-lg text-forest">Parakh</span>
          <span>Fair prices. Happy customers.</span>
        </div>
      </footer>
    </div>
  );
}
