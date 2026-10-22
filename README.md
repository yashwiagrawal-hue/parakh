# Parakh MVP

Custom-jewellery quotes that customers can check and trust. Next.js (App Router, TypeScript), Tailwind, Vitest. No external API keys.

## Run

```bash
npm install
npm test         # pricing + enquiry tests
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## Screens

- `/` set today's rates (yours and IBJA), see recent quotes
- `/new` pick a design (live preview and weight range) or paste an enquiry, then "Approve and create link"
- `/q/[id]` public quote page, only for approved quotes

## Where things are

- `lib/pricing.ts` all money maths (integer paise); `lib/checks.ts` rate sanity checks
- `lib/enquiry.ts` local rule-based enquiry reader (never guesses; the jeweller confirms)
- `lib/store.ts` local JSON quote store. Temporary on Vercel, see `docs/later.md`
- `data/catalogue.json` demo designs and weights (placeholders), `data/jeweller.json` demo profile

## Deploy

Push to GitHub and import in Vercel. Set `GST_RATE` and `MAX_IBJA_GAP` if you change them.
Before real use, replace the file store with a database so quote links persist.
