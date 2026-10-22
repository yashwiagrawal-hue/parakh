import RateSettingsForm from "@/components/RateSettingsForm";
import { getJeweller } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RateSettingsPage() {
  const j = await getJeweller();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Rate Settings</h1>
        <p className="mt-1 text-muted">Sent quotes keep the rate they were created with. Changes apply to new quotes only.</p>
      </div>
      <RateSettingsForm key={j.rateUpdatedAt} jeweller={j} />
    </div>
  );
}
