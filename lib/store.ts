import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import type { QuoteRecord } from "./quote";

/**
 * Local JSON store for approved quotes.
 * Fine for the demo and local use. On Vercel the filesystem is temporary, so swap
 * these functions for a real database (see docs/later.md) before real customers use links.
 */
function storePath(): string {
  if (process.env.QUOTE_STORE_PATH) return process.env.QUOTE_STORE_PATH;
  if (process.env.VERCEL) return "/tmp/parakh-quotes.json";
  return path.join(process.cwd(), "data", "quotes.local.json");
}

async function readAll(): Promise<Record<string, QuoteRecord>> {
  try {
    return JSON.parse(await fs.readFile(storePath(), "utf8")) as Record<string, QuoteRecord>;
  } catch {
    return {};
  }
}

export function newQuoteId(): string {
  return nanoid(12);
}

/** Approved quotes are immutable: an existing id is never overwritten. */
export async function saveApprovedQuote(record: QuoteRecord): Promise<void> {
  const all = await readAll();
  if (all[record.id]) throw new Error("Quote already exists.");
  all[record.id] = record;
  const file = storePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(all, null, 2), "utf8");
}

/** Only approved quotes are ever returned. */
export async function getApprovedQuote(id: string): Promise<QuoteRecord | null> {
  if (!/^[A-Za-z0-9_-]{12}$/.test(id)) return null;
  const q = (await readAll())[id];
  return q && q.status === "approved" ? q : null;
}

export async function listRecentQuotes(limit = 8): Promise<QuoteRecord[]> {
  return Object.values(await readAll())
    .filter((q) => q.status === "approved")
    .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))
    .slice(0, limit);
}
