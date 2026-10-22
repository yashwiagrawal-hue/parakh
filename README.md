# Parakh

Turn WhatsApp jewellery enquiries into trusted, transparent quotes in under 2 minutes: a full price breakdown,
an IBJA benchmark comparison and written rate-lock terms, shared as one mobile-friendly link.

Next.js (App Router) · TypeScript · Tailwind CSS · lucide-react · Vitest. No external API keys.

## Setup

```bash
npm install
npm run seed     # demo jeweller "Shree Jewellers" + 4 sample quotes -> data/db.local.json
npm run dev      # http://localhost:3000
npm test         # pricing and enquiry-parser tests
npm run lint
npm run build
```

## Screens

| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/dashboard` | Today's gold rate vs IBJA, stats, recent quotes |
| `/quotes/new` | 4-step wizard: Details → Design → Review → Send |
| `/quotes` | All quotes with status filter and search |
| `/settings/rates` | 22K/24K/18K rates, IBJA, defaults, rate-lock terms |
| `/q/[slug]` | Public customer quote (mobile-first, print to PDF) |
| `/customers`, `/payments`, `/reminders`, `/settings` | Coming soon |

## Where things are

- `lib/pricing.ts`: all money maths (rates per 10 g, each line rounded to the rupee). Tests in `lib/pricing.test.ts`.
- `lib/parseEnquiry.ts`: rule-based enquiry reader (weight, purity, category). Never guesses. Tests alongside.
- `lib/checks.ts`: rate sanity checks (per-gram rate entered by mistake, >10% from IBJA, stale rates).
- `lib/db.ts`: the only module that touches storage. Private Vercel Blob on Vercel, `data/db.local.json` locally.
  Swap it for Postgres/Supabase later without touching the UI.
- `lib/seed.ts`: demo jeweller, 8 designs, 4 board quotes (totals recalculated, never copied).
- `public/designs/`: original SVG illustrations.

## Storage

Quotes snapshot the rate they were created with, so later rate changes never alter a sent quote. Only `status`
and `viewedAt` change after sending. Locally everything is in `data/db.local.json` (git-ignored). To seed or
use the Blob store from your machine, pull its token and opt in:

```bash
npx vercel env pull .env.local
```

```bash
QUOTE_STORE=blob npx tsx --env-file=.env.local scripts/seed.ts
```

## Deploy

Live at https://parakh-iota.vercel.app (Vercel project `yash-7b87/parakh`, Blob store `parakh-quotes`).

```bash
npx vercel deploy --prod --scope yash-7b87
```

## Not built yet

Real payments (the "Pay Advance" page is a marked placeholder), authentication, and the Coming soon pages.
See `docs/later.md`.
