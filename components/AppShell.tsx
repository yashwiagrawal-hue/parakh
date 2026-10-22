"use client";

import {
  Bell,
  CalendarClock,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  SlidersHorizontal,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quotes/new", label: "New Quote", icon: FilePlus2 },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/settings/rates", label: "Rate Settings", icon: SlidersHorizontal },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/reminders", label: "Reminders", icon: CalendarClock },
];

function isActive(pathname: string, href: string) {
  if (href === "/quotes") return pathname === "/quotes" || (pathname.startsWith("/quotes/") && pathname !== "/quotes/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Bell; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.95rem] transition ${
        active ? "bg-forest-tint font-semibold text-forest" : "text-ink/80 hover:bg-forest-tint/60 hover:text-ink"
      }`}
    >
      <Icon aria-hidden size={18} strokeWidth={1.75} />
      {label}
    </Link>
  );
}

export default function AppShell({
  jewellerName,
  initials,
  children,
}: {
  jewellerName: string;
  initials: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <nav aria-label="Main" className="flex h-full flex-col gap-1">
      {NAV.map((n) => (
        <NavLink key={n.href} {...n} active={isActive(pathname, n.href)} />
      ))}
      <div className="mt-auto pt-6">
        <NavLink href="/settings" label="Settings" icon={Settings} active={pathname === "/settings"} />
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-line bg-surface/60 px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Logo href="/dashboard" className="mb-8 px-3" />
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-ink/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 max-w-[85%] flex-col bg-surface px-4 py-5 shadow-lift">
            <div className="mb-6 flex items-center justify-between px-3">
              <Logo href="/dashboard" />
              <button className="rounded-lg p-2" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-ivory/90 px-4 py-3 backdrop-blur sm:px-8">
          <button className="rounded-lg p-2 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={22} aria-hidden />
          </button>
          <Logo href="/dashboard" className="text-2xl lg:hidden" />
          <form action="/quotes" role="search" className="relative ml-auto hidden max-w-sm flex-1 sm:block lg:ml-0">
            <Search aria-hidden size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <label htmlFor="global-search" className="sr-only">
              Search quotes and customers
            </label>
            <input
              id="global-search"
              name="q"
              type="search"
              placeholder="Search quotes, customers…"
              className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm placeholder:text-muted/80"
            />
          </form>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/reminders" className="rounded-lg p-2 text-ink/80 hover:text-ink" aria-label="Notifications">
              <Bell size={20} strokeWidth={1.75} aria-hidden />
            </Link>
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-tint text-sm font-semibold text-forest"
            >
              {initials}
            </span>
            <span className="hidden text-sm font-medium md:inline">{jewellerName}</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
