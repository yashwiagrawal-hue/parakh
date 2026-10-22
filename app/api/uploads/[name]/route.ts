import { readUpload } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  if (!/^[\w-]{16}\.(jpg|png|webp)$/.test(params.name)) return new Response("Not found", { status: 404 });
  const file = await readUpload(params.name);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.body as BodyInit, {
    headers: { "Content-Type": file.contentType, "Cache-Control": "private, max-age=3600" },
  });
}
