# Later (out of scope for Thursday)

- **Permanent quote storage.** Quotes are saved in a local JSON file (`lib/store.ts`). On Vercel that is temporary (`/tmp`), so links can disappear. Replace `saveApprovedQuote`, `getApprovedQuote` and `listRecentQuotes` with a database (Vercel Postgres/KV, Supabase) or the n8n Data Table from CLAUDE.md before real customers use links.
- **AI enquiry reader.** The paste-an-enquiry tab uses a local rule-based reader (`lib/enquiry.ts`), no API key. Swap in the n8n + Claude workflow from CLAUDE.md later; keep the same JSON shape and the confirm step.
- **n8n workflows** (`parse-enquiry`, `save-quote`, `get-quote`) and the `x-parakh-secret` header.
- **"Edit an approved quote" screen.** The API already accepts `supersedes` (new quote that references the old id); there is no button for it yet.
- **Real jeweller data:** weights, 18K/14K weights (currently 22K weights times 0.88 / 0.78), making and wastage defaults, lock table.
- **Draft quotes.** The `draft` status exists in the type but nothing saves drafts yet.
