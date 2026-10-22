import { NextResponse } from "next/server";
import { getApprovedQuote } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const quote = await getApprovedQuote(params.id);
  if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  return NextResponse.json(quote);
}
