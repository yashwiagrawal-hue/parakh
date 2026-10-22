"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/** Marks the quote as Viewed on first open (in the browser only, so link-preview bots don't count). */
export function MarkViewed({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `parakh.viewed.${slug}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked: still report the view once per page load
    }
    fetch(`/api/quotes/${slug}/view`, { method: "POST" }).catch(() => {});
  }, [slug]);
  return null;
}

export function QuoteButtons({ slug, expired }: { slug: string; expired: boolean }) {
  return (
    <div className="no-print grid gap-3 sm:grid-cols-2">
      {expired ? (
        <span className="btn cursor-not-allowed opacity-50" aria-disabled="true">
          Proceed to Pay Advance
        </span>
      ) : (
        <Link href={`/q/${slug}/pay`} className="btn">
          Proceed to Pay Advance
        </Link>
      )}
      <button type="button" className="btn-outline" onClick={() => window.print()}>
        <Download aria-hidden size={17} /> Download PDF
      </button>
    </div>
  );
}
