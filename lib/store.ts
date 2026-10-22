import { promises as fs } from "node:fs";
import path from "node:path";
import { BlobError, get, list, put } from "@vercel/blob";
import { nanoid } from "nanoid";
import type { QuoteRecord } from "./quote";

/**
 * Approved quotes are stored in a private Vercel Blob store on Vercel (one JSON file per quote),
 * and in a local JSON file during development. Set QUOTE_STORE=blob to use Blob locally.
 */
const blobEnabled = (): boolean => process.env.QUOTE_STORE === "blob" || !!process.env.VERCEL;

const ID_RE = /^[A-Za-z0-9_-]{12}$/;
const blobPath = (id: string) => `quotes/${id}.json`;

export class QuoteExistsError extends Error {
  constructor() {
    super("Quote already exists.");
  }
}

export function newQuoteId(): string {
  return nanoid(12);
}

// --- Local JSON file (development) ---

function filePath(): string {
  return process.env.QUOTE_STORE_PATH ?? path.join(process.cwd(), "data", "quotes.local.json");
}

async function readFileStore(): Promise<Record<string, QuoteRecord>> {
  try {
    return JSON.parse(await fs.readFile(filePath(), "utf8")) as Record<string, QuoteRecord>;
  } catch {
    return {};
  }
}

// --- Vercel Blob (production) ---

async function readBlob(id: string): Promise<QuoteRecord | null> {
  const res = await get(blobPath(id), { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return JSON.parse(await new Response(res.stream).text()) as QuoteRecord;
}

/** Approved quotes are immutable: an existing id is never overwritten. */
export async function saveApprovedQuote(record: QuoteRecord): Promise<void> {
  if (blobEnabled()) {
    try {
      await put(blobPath(record.id), JSON.stringify(record), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: false,
      });
    } catch (e) {
      // Blob reports an existing pathname as a plain BlobError ("This blob already exists").
      if (e instanceof BlobError && /already exists/i.test(e.message)) throw new QuoteExistsError();
      throw e;
    }
    return;
  }

  const all = await readFileStore();
  if (all[record.id]) throw new QuoteExistsError();
  all[record.id] = record;
  const file = filePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(all, null, 2), "utf8");
}

/** Only approved quotes are ever returned. */
export async function getApprovedQuote(id: string): Promise<QuoteRecord | null> {
  if (!ID_RE.test(id)) return null;
  const q = blobEnabled() ? await readBlob(id) : (await readFileStore())[id];
  return q && q.status === "approved" ? q : null;
}

export async function listRecentQuotes(limit = 8): Promise<QuoteRecord[]> {
  let quotes: QuoteRecord[];
  if (blobEnabled()) {
    const { blobs } = await list({ prefix: "quotes/", limit: 1000 });
    const recent = blobs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, limit)
      .map((b) => b.pathname.slice("quotes/".length, -".json".length));
    quotes = (await Promise.all(recent.map(readBlob))).filter((q): q is QuoteRecord => q !== null);
  } else {
    quotes = Object.values(await readFileStore());
  }
  return quotes
    .filter((q) => q.status === "approved")
    .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))
    .slice(0, limit);
}
