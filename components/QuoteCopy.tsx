"use client";

import CopyButton from "./CopyButton";
import type { QuoteRecord } from "@/lib/quote";
import { whatsappMessage } from "@/lib/whatsapp";

export default function QuoteCopy({ quote }: { quote: QuoteRecord }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CopyButton
        label="Copy for WhatsApp"
        getText={() => whatsappMessage(quote, `${window.location.origin}/q/${quote.id}`)}
      />
    </div>
  );
}
