import {
  Check,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Languages,
  Lock,
  PlayCircle,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
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

const STEPS = [
  { title: "Paste the enquiry", time: "20 sec", text: "Drop in the customer's WhatsApp message and photo. Parakh picks out the weight, purity and type of piece for you to check." },
  { title: "Pick the design", time: "30 sec", text: "Choose from your catalogue, then confirm the weight range, making charges, wastage and stones." },
  { title: "Review the price", time: "30 sec", text: "See every line priced from today's rate: gold, making, stones and GST, with your rate next to IBJA." },
  { title: "Send the link", time: "10 sec", text: "Copy the link or open WhatsApp with a ready-written message. Your customer opens it on any phone." },
];

const FEATURE_LIST = [
  { icon: FileText, title: "Full price breakup", text: "Gold, making charges, wastage, stones and GST on separate lines, for a single weight or a weight range." },
  { icon: Scale, title: "IBJA comparison", text: "Your gold rate is shown beside the IBJA benchmark with the difference in rupees, so nothing is hidden." },
  { icon: Lock, title: "Written rate-lock terms", text: "Every quote states how long the rate is held, the advance needed and the exact date it ends." },
  { icon: Languages, title: "Reads real enquiries", text: "Understands messages like “22 kt anguthi 5 gram” or “jhumka 8 gm”, in English or Hinglish. You confirm every field." },
  { icon: ShieldAlert, title: "Rate safety checks", text: "Catches a per-gram rate typed as per 10 g, or a rate more than 10% away from IBJA, before a quote goes out." },
  { icon: Eye, title: "Know when it's opened", text: "Each quote moves from Sent to Viewed when your customer opens the link, so you know when to follow up." },
];

const FOR_JEWELLER = [
  "Quote in under 2 minutes instead of working it out by hand",
  "The same pricing method for every staff member and every customer",
  "Rates are saved with each quote, so a sent price never changes by mistake",
  "A professional, branded quote that stands out from a plain text reply",
];

const FOR_CUSTOMER = [
  "Sees exactly what they are paying for, line by line",
  "Can compare your gold rate with the IBJA benchmark",
  "Knows the rate is held, until when, and for what advance",
  "Opens it on any phone from WhatsApp and can download a PDF",
];

const PLAN_NOW = [
  "Unlimited quotes and quote links",
  "Full price breakup with IBJA comparison",
  "Written rate-lock terms with expiry date",
  "WhatsApp sharing and PDF download",
  "Ring, necklace, earring and bracelet designs, plus custom pieces",
];

const PLAN_LATER = [
  "Suggested gold rate from live market data",
  "Collect advances by UPI from the quote page",
  "Separate logins for your staff",
  "Customer history and rate-lock reminders",
];

const FAQ: [string, string][] = [
  ["Does my customer need to install anything?", "No. The quote opens in any phone browser straight from WhatsApp, and they can download it as a PDF."],
  ["Where does the gold rate come from?", "You enter today's rate and the IBJA benchmark yourself. Parakh shows both on the quote and warns you if they are far apart."],
  ["Can the price change after I send a quote?", "No. The rate and every line are saved with the quote when you create the link. To change anything, create a new quote."],
  ["What does my customer see?", "Their design, weight, every price line, your rate beside IBJA and the rate-lock terms. Each link has a random, hard-to-guess code, and the customer's phone number is never shown on it."],
  ["What does it cost?", "Nothing during early access. If paid plans are introduced, you will be told the price before anything is charged."],
];

function SectionHead({ eyebrow, title, text, center }: { eyebrow: string; title: string; text: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl leading-tight sm:text-[2.6rem]">{title}</h2>
      <p className="mt-3 text-[1.05rem] leading-relaxed text-muted">{text}</p>
    </div>
  );
}

function AudienceCard({ icon: Icon, title, items, tone }: { icon: typeof Store; title: string; items: string[]; tone?: "gold" }) {
  return (
    <div className="card p-7">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone === "gold" ? "bg-gold-tint text-gold-ink" : "bg-forest-tint text-forest"}`}>
          <Icon aria-hidden size={20} strokeWidth={1.6} />
        </span>
        <h3 className="title-sans text-lg">{title}</h3>
      </div>
      <ul className="mt-5 space-y-3.5">
        {items.map((t) => (
          <li key={t} className="flex gap-3 text-[0.95rem]">
            <Check aria-hidden size={18} className={`mt-0.5 shrink-0 ${tone === "gold" ? "text-gold-ink" : "text-forest"}`} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
                into <em className="text-gold-soft">trusted jewellery quotes</em> <br className="hidden lg:block" />
                <em>in under</em> <em className="text-gold-soft">2&nbsp;minutes.</em>
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

              <ul className="mt-14 grid max-w-xl gap-6 sm:grid-cols-3">
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

        {/* 1. How it works: the four steps, in the order the jeweller does them. */}
        <section id="how-it-works" className="scroll-mt-6 border-t border-line bg-surface/60">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <SectionHead eyebrow="How it works" title="From WhatsApp message to a quote link in four steps" text="No spreadsheets and no calculator. You stay in charge of every number before it goes out." />
            <ol className="mt-10 grid gap-5 md:grid-cols-4">
              {STEPS.map(({ title, text, time }, i) => (
                <li key={title} className="card relative p-6">
                  <div className="flex items-center justify-between">
                    <span className="tnum flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-semibold text-on-forest">{i + 1}</span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock aria-hidden size={13} /> {time}
                    </span>
                  </div>
                  <p className="mt-5 font-semibold">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 2. Features: what is in the product today. */}
        <section id="features" className="scroll-mt-6">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <SectionHead eyebrow="Features" title="Everything a customer needs to say yes" text="Each quote is built from your rates and your charges, and laid out so a customer can check it line by line." />
            <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_LIST.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-tint text-gold-ink ring-1 ring-gold/20">
                    <Icon aria-hidden size={20} strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. For jewellers: what changes in the shop, and what the customer sees. */}
        <section id="for-jewellers" className="scroll-mt-6 border-y border-line bg-surface/60">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <SectionHead eyebrow="For jewellers" title="Made for shops that quote on WhatsApp every day" text="Custom orders are where trust is won or lost. Parakh gives your price the paperwork it deserves." />
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <AudienceCard icon={Store} title="For you and your staff" items={FOR_JEWELLER} />
              <AudienceCard icon={Users} title="For your customer" items={FOR_CUSTOMER} tone="gold" />
            </div>
          </div>
        </section>

        {/* 4. Pricing: honest about what is free today and what is still to come. */}
        <section id="pricing" className="scroll-mt-6">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <SectionHead eyebrow="Pricing" title="Free while in early access" text="Use every feature at no cost while we build Parakh with jewellers. No card needed." center />
            <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
              <div className="card relative flex flex-col p-7 ring-1 ring-forest/20">
                <span className="absolute -top-3 left-7 rounded-full bg-forest px-3 py-1 text-xs font-medium text-on-forest">Available now</span>
                <p className="font-semibold">Early access</p>
                <p className="mt-3 font-serif text-5xl">₹0</p>
                <p className="mt-1 text-sm text-muted">for every quote you send</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {PLAN_NOW.map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <Check aria-hidden size={17} className="mt-0.5 shrink-0 text-forest" /> {t}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="btn mt-7 w-full">
                  Get Started Free
                </Link>
              </div>
              <div className="card flex flex-col bg-[#FCFAF6] p-7">
                <p className="font-semibold">Parakh Pro</p>
                <p className="mt-3 font-serif text-3xl text-ink/80">Coming soon</p>
                <p className="mt-1 text-sm text-muted">Pricing will be shared before anything is charged</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-ink/80">
                  {PLAN_LATER.map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <Sparkles aria-hidden size={16} className="mt-0.5 shrink-0 text-gold-ink" /> {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-7 rounded-lg bg-gold-tint px-4 py-3 text-sm text-ink/80">Early-access shops will hear about Pro first.</p>
              </div>
            </div>

            <div className="mx-auto mt-16 max-w-3xl">
              <h3 className="text-center text-2xl">Questions jewellers ask</h3>
              <div className="mt-6 divide-y divide-line rounded-card border border-line bg-surface">
                {FAQ.map(([q, a]) => (
                  <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                      {q}
                      <ChevronDown aria-hidden size={18} className="shrink-0 text-muted transition group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-4 pb-20 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 overflow-hidden rounded-[20px] bg-forest px-8 py-12 text-on-forest sm:flex-row sm:items-center sm:justify-between sm:px-12">
            <div>
              <h2 className="text-3xl text-on-forest sm:text-4xl">
                Send your next quote <em className="text-gold">the trusted way.</em>
              </h2>
              <p className="mt-2 max-w-xl text-on-forest/80">Paste a WhatsApp enquiry and see the full breakup in under 2 minutes.</p>
            </div>
            <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-surface px-6 py-3 font-medium text-forest transition hover:bg-gold-tint">
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <span className="font-serif text-xl text-forest">Parakh</span>
            <p className="mt-1">Fair prices. Happy customers.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV.map((n) => (
              <a key={n} href={`#${n.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-ink">
                {n}
              </a>
            ))}
            <Link href="/login" className="hover:text-ink">
              Log in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
