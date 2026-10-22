import { ImageResponse } from "next/og";
import { getQuote } from "@/lib/db";
import { formatTotal, formatWeightRange } from "@/lib/format";
import { SLUG_RE, quoteTitle } from "@/lib/quotes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Jewellery quote from Parakh";

/** WhatsApp link preview: title, total and jeweller. No personal data. */
export default async function OgImage({ params }: { params: { slug: string } }) {
  const q = SLUG_RE.test(params.slug) ? await getQuote(params.slug) : null;
  const title = q ? quoteTitle(q) : "Jewellery quote";
  const total = q ? formatTotal(q.breakdown) : "";
  const detail = q ? `${q.purity} gold · ${formatWeightRange(q.weightMin, q.weightMax)} · incl. GST` : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F7F3EA", padding: "64px 72px", fontFamily: "serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 48, color: "#294B39" }}>Parakh</span>
          {q && <span style={{ fontSize: 28, color: "#8C682E", fontFamily: "sans-serif" }}>Trusted by {q.jewellerName}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 68, color: "#1F2420", lineHeight: 1.1 }}>{title}</span>
          {q && <span style={{ fontSize: 30, color: "#68665C", marginTop: 18, fontFamily: "sans-serif" }}>{detail}</span>}
        </div>
        {q ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FBF5E9", border: "2px solid #C5A46D", borderRadius: 24, padding: "26px 36px", fontFamily: "sans-serif" }}>
            <span style={{ fontSize: 32, color: "#1F2420" }}>Total Estimate</span>
            <span style={{ fontSize: 54, fontWeight: 700, color: "#1F2420" }}>{total}</span>
          </div>
        ) : (
          <span />
        )}
      </div>
    ),
    size,
  );
}
