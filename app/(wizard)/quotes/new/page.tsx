import type { Metadata } from "next";
import QuoteWizard from "@/components/wizard/QuoteWizard";
import { getJeweller } from "@/lib/db";
import { DESIGNS } from "@/lib/seed";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New quote · Parakh" };

export default async function NewQuotePage() {
  const jeweller = await getJeweller();
  return <QuoteWizard jeweller={jeweller} designs={DESIGNS} />;
}
