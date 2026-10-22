# CLAUDE.md – Parakh

Parakh turns WhatsApp jewellery enquiries into trusted quotes: full price breakdown, the jeweller's rate next to
the IBJA benchmark, and written rate-lock terms, shared as one mobile-friendly link. The design reference is the
concept board (7 screens: Landing, Dashboard, Create Quote steps 1–3, Customer Quote View, Send on WhatsApp).

## Non-negotiable rules

- **AI never calculates money.** Every number on a quote comes from `lib/pricing.ts`. The enquiry reader only extracts fields.
- **The enquiry reader never guesses.** Unclear fields come back `null` and are listed in `missing`; the jeweller confirms everything in the Design step.
- **Sent quotes keep their rate.** `rateUsed` and `ibjaRateUsed` are snapshotted at creation. After sending, only `status` and `viewedAt` may change.
- **The server recomputes.** `POST /api/quotes` rebuilds the breakdown from the stored rates; it never trusts prices from the browser.
- **No personal data in URLs.** Public links use a random 8-character slug. Customer name and phone live only in the quote record.
- **Catalogue images are original.** Our own SVG illustrations or the jeweller's photos. Never copy brand or stock images.
- **No secrets in code or git.** `.env.local` (Blob token) stays git-ignored.
- **Ask before** adding a paid service, a real payment gateway or an auth provider.

## Pricing (`lib/pricing.ts`)

Rates are rupees per 10 g. For weight w: gold = rate/10 × w; making = gold × making%; wastage = gold × wastage%;
subtotal = gold + making + wastage + stones; gst = subtotal × GST%; total = subtotal + gst. Each line is rounded to
the rupee, and the total is the sum of the rounded lines. Computed at min and max weight; min = max shows one estimate.
24K = 22K × 24/22 and 18K = 22K × 18/22 by default, overridable in Rate Settings. Advance = total at max weight × advance%.

Required test: ₹1,34,300/10g, 5 g, making 9%, wastage 0%, stones ₹4,000, GST 3% → gold ₹67,150, making ₹6,044,
GST ₹2,316, total ₹79,510.

## Rate sanity checks (`lib/checks.ts`, block saving)

- A rate under ₹30,000 per 10 g → "This looks like a per-gram rate. Enter the rate per 10 g."
- More than `MAX_IBJA_GAP` (default 10%) from IBJA → "Today's rate is X% above IBJA. Check it before quoting."
- Rates older than 3 days → warning.

## Stack and storage

Next.js App Router + TypeScript + Tailwind + lucide-react; DM Serif Display (logo, headings, hero italics) and Inter
(everything else, tabular numbers for prices). Storage is isolated in `lib/db.ts`: private Vercel Blob on Vercel,
`data/db.local.json` locally. No Prisma: a SQLite file does not persist on Vercel.

## UI rules

Ivory `#F7F3EA` background, forest `#294B39` primary, gold `#C5A46D` accents, white cards; tokens in `app/globals.css`
with a dark-mode set. Rounded cards, thin warm borders, light shadows. Mobile first (no horizontal scroll at 375 px),
visible focus, reduced motion respected, AA contrast. Money via `Intl.NumberFormat("en-IN", { style: "currency",
currency: "INR", maximumFractionDigits: 0 })`. Show the IBJA gap neutrally ("+₹100"). Errors say what happened and what to do.

## Commands

`npm run dev` · `npm test` (must pass before every commit) · `npm run lint` · `npm run build` · `npm run seed`
