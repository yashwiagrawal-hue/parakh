import AppShell from "@/components/AppShell";
import { getJeweller } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Jeweller screens with the sidebar. No auth yet: the seeded jeweller is the logged-in user. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const j = await getJeweller();
  return (
    <AppShell jewellerName={j.name} initials={j.logoInitials}>
      {children}
    </AppShell>
  );
}
