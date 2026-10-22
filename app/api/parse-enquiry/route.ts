import { NextResponse } from "next/server";
import { z } from "zod";
import { parseEnquiry } from "@/lib/enquiry";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ text: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Couldn't read this enquiry. Fill the fields yourself." },
      { status: 400 },
    );
  }
  return NextResponse.json(parseEnquiry(parsed.data.text));
}
