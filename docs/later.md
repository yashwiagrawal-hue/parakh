# Later (out of scope for Thursday)

- **Quote storage at scale.** On Vercel, quotes are one private JSON file each in the `parakh-quotes` Blob store (`lib/store.ts`). "Recent quotes" lists the store, which is fine for a demo; move to a database when there are thousands of quotes or several jewellers.
- **AI enquiry reader.** The paste-an-enquiry tab uses a local rule-based reader (`lib/enquiry.ts`), no API key. Swap in the n8n + Claude workflow from CLAUDE.md later; keep the same JSON shape and the confirm step.
- **n8n workflows** (`parse-enquiry`, `save-quote`, `get-quote`) and the `x-parakh-secret` header.
- **"Edit an approved quote" screen.** The API already accepts `supersedes` (new quote that references the old id); there is no button for it yet.
- **Real jeweller data:** weights, 18K/14K weights (currently 22K weights times 0.88 / 0.78), making and wastage defaults, lock table.
- **Draft quotes.** The `draft` status exists in the type but nothing saves drafts yet.
