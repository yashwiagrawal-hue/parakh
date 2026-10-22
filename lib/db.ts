import { promises as fs } from "node:fs";
import path from "node:path";
import { BlobError, get, list, put } from "@vercel/blob";
import { SEED_JEWELLER } from "./seed";
import type { Jeweller, Quote } from "./types";

/**
 * The only module that touches storage. Swap these functions for Postgres/Supabase later.
 * - On Vercel (or QUOTE_STORE=blob): private Vercel Blob, one JSON file per record.
 * - Locally: data/db.local.json plus data/uploads/.
 */
const blobEnabled = (): boolean => process.env.QUOTE_STORE === "blob" || !!process.env.VERCEL;

const JEWELLER_PATH = "v2/jeweller.json";
const quotePath = (slug: string) => `v2/quotes/${slug}.json`;
const uploadPath = (name: string) => `v2/uploads/${name}`;

interface LocalDb {
  jeweller: Jeweller | null;
  quotes: Record<string, Quote>;
}

const localFile = () => process.env.DB_PATH ?? path.join(process.cwd(), "data", "db.local.json");
const localUploads = () => path.join(process.cwd(), "data", "uploads");

async function readLocal(): Promise<LocalDb> {
  try {
    return JSON.parse(await fs.readFile(localFile(), "utf8")) as LocalDb;
  } catch {
    return { jeweller: null, quotes: {} };
  }
}

async function writeLocal(db: LocalDb): Promise<void> {
  await fs.mkdir(path.dirname(localFile()), { recursive: true });
  await fs.writeFile(localFile(), JSON.stringify(db, null, 2), "utf8");
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return JSON.parse(await new Response(res.stream).text()) as T;
}

async function writeBlobJson(pathname: string, value: unknown, allowOverwrite: boolean): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite,
  });
}

// --- Jeweller ---

export async function getJeweller(): Promise<Jeweller> {
  const stored = blobEnabled() ? await readBlobJson<Jeweller>(JEWELLER_PATH) : (await readLocal()).jeweller;
  return { ...SEED_JEWELLER, ...(stored ?? {}) };
}

export async function saveJeweller(j: Jeweller): Promise<void> {
  if (blobEnabled()) return writeBlobJson(JEWELLER_PATH, j, true);
  const db = await readLocal();
  await writeLocal({ ...db, jeweller: j });
}

// --- Quotes ---

export class QuoteExistsError extends Error {
  constructor() {
    super("A quote with this link already exists.");
  }
}

/** New quotes are never written over an existing one. */
export async function createQuote(q: Quote): Promise<void> {
  if (blobEnabled()) {
    try {
      await writeBlobJson(quotePath(q.slug), q, false);
    } catch (e) {
      // Blob reports an existing pathname as a plain BlobError ("This blob already exists").
      if (e instanceof BlobError && /already exists/i.test(e.message)) throw new QuoteExistsError();
      throw e;
    }
    return;
  }
  const db = await readLocal();
  if (db.quotes[q.slug]) throw new QuoteExistsError();
  db.quotes[q.slug] = q;
  await writeLocal(db);
}

/** Seed script only: rewrites the demo quotes. Real quotes go through createQuote. */
export async function replaceSeedQuote(q: Quote): Promise<void> {
  if (!q.slug.startsWith("seed")) throw new Error("Only seed quotes can be replaced.");
  if (blobEnabled()) return writeBlobJson(quotePath(q.slug), q, true);
  const db = await readLocal();
  db.quotes[q.slug] = q;
  await writeLocal(db);
}

export async function getQuote(slug: string): Promise<Quote | null> {
  if (blobEnabled()) return readBlobJson<Quote>(quotePath(slug));
  return (await readLocal()).quotes[slug] ?? null;
}

/** Status and viewedAt are the only fields that change after a quote is sent. Prices never do. */
export async function updateQuoteStatus(
  slug: string,
  patch: Pick<Partial<Quote>, "status" | "viewedAt">,
): Promise<Quote | null> {
  const q = await getQuote(slug);
  if (!q) return null;
  const next: Quote = { ...q, ...patch };
  if (blobEnabled()) await writeBlobJson(quotePath(slug), next, true);
  else {
    const db = await readLocal();
    db.quotes[slug] = next;
    await writeLocal(db);
  }
  return next;
}

export async function listQuotes(): Promise<Quote[]> {
  let quotes: Quote[];
  if (blobEnabled()) {
    const { blobs } = await list({ prefix: "v2/quotes/", limit: 1000 });
    quotes = (await Promise.all(blobs.map((b) => readBlobJson<Quote>(b.pathname)))).filter(
      (q): q is Quote => q !== null,
    );
  } else {
    quotes = Object.values((await readLocal()).quotes);
  }
  return quotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// --- Uploads (reference photos) ---

export async function saveUpload(name: string, data: Buffer, contentType: string): Promise<void> {
  if (blobEnabled()) {
    await put(uploadPath(name), data, { access: "private", contentType, addRandomSuffix: false });
    return;
  }
  await fs.mkdir(localUploads(), { recursive: true });
  await fs.writeFile(path.join(localUploads(), name), data);
}

export async function readUpload(name: string): Promise<{ body: ReadableStream | Buffer; contentType: string } | null> {
  if (blobEnabled()) {
    const res = await get(uploadPath(name), { access: "private" });
    if (!res || res.statusCode !== 200) return null;
    return { body: res.stream, contentType: res.blob.contentType };
  }
  try {
    const ext = path.extname(name).slice(1).toLowerCase();
    const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return { body: await fs.readFile(path.join(localUploads(), name)), contentType: type };
  } catch {
    return null;
  }
}
