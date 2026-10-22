/**
 * Seeds the jeweller and the four concept-board quotes.
 *   npm run seed                      -> local data/db.local.json
 *   QUOTE_STORE=blob npm run seed     -> the Vercel Blob store (needs BLOB_READ_WRITE_TOKEN)
 * Re-running is safe: the demo quotes (slugs seed1demo–seed4demo) are rewritten; real quotes are untouched.
 */
import { replaceSeedQuote, saveJeweller } from "../lib/db";
import { buildQuote } from "../lib/quotes";
import { SEED_JEWELLER, SEED_QUOTES } from "../lib/seed";

async function main() {
  await saveJeweller(SEED_JEWELLER);
  console.log(`Jeweller: ${SEED_JEWELLER.name}`);

  for (const [i, s] of SEED_QUOTES.entries()) {
    const slug = `seed${i + 1}demo`;
    const q = buildQuote(
      {
        customerName: s.customerName,
        customerPhone: null,
        enquiryText: null,
        referencePhotoUrl: null,
        designId: s.designId,
        category: s.category,
        purity: "22K",
        weightMin: s.weight,
        weightMax: s.weight,
        makingPct: SEED_JEWELLER.defaultMakingPct,
        wastagePct: SEED_JEWELLER.defaultWastagePct,
        stones: s.stones,
      },
      SEED_JEWELLER,
      { slug, createdAt: s.createdAt, status: s.status },
    );
    q.designName = s.designName;
    if (s.status === "Viewed" || s.status === "Advance Paid") q.viewedAt = s.createdAt;
    await replaceSeedQuote(q);
    console.log(`  ${slug}  ${s.customerName.padEnd(11)} ${String(s.weight).padStart(5)} g  ₹${q.breakdown.max.total}  ${s.status}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
