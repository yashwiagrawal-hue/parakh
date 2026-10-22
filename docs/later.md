# Later

- **Payments.** "Proceed to Pay Advance" opens a placeholder (`app/q/[slug]/pay`). Add a UPI intent link or a gateway, then mark the quote "Advance Paid". Ask before adding any paid service.
- **Authentication.** The seeded jeweller is treated as logged in. `app/(app)/layout.tsx` and `lib/db.ts#getJeweller` are where a session would plug in.
- **Customers, Payments, Reminders, Settings** pages are "Coming soon".
- **Database.** `lib/db.ts` keeps one private Blob JSON file per quote. Move to Postgres/Supabase when there are thousands of quotes or several jewellers (only `lib/db.ts` changes).
- **AI enquiry reader.** `lib/parseEnquiry.ts` is rule-based. A model can replace it later behind the same shape; the jeweller still confirms every field.
- **Real catalogue.** Replace the SVG illustrations and typical weights with the jeweller's own photos and weight table.
- **Link preview image in local dev.** `next/og` fails on Windows dev servers (a font file-path bug); it works on Vercel.
- **Auto-deploy on push.** Give the Vercel GitHub app access to `yashwiagrawal-hue/parakh`.
