import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/db";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 5 * 1024 * 1024;

/** Reference photo from the enquiry. Stored privately; served back through /api/uploads/[name]. */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Upload a JPG, PNG or WebP photo." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "The photo is over 5 MB. Choose a smaller one." }, { status: 413 });

  const name = `${nanoid(16)}.${ext}`;
  await saveUpload(name, Buffer.from(await file.arrayBuffer()), file.type);
  return NextResponse.json({ url: `/api/uploads/${name}` }, { status: 201 });
}
