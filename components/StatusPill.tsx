import type { QuoteStatus } from "@/lib/types";

const STYLES: Record<QuoteStatus, string> = {
  Draft: "bg-pill-muted text-muted",
  Sent: "bg-pill-sent text-pill-sent-ink",
  Viewed: "bg-pill-viewed text-pill-viewed-ink",
  "Advance Paid": "bg-pill-paid text-pill-paid-ink",
  Expired: "bg-pill-muted text-muted",
};

export default function StatusPill({ status }: { status: QuoteStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status}
    </span>
  );
}
