import Link from "next/link";

/** Jeweller screens only. The public quote page at /q/[id] does not use this layout. */
export default function JewellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Parakh
          </Link>
          <nav className="flex gap-4 text-base">
            <Link href="/" className="underline-offset-4 hover:underline">
              Rates
            </Link>
            <Link href="/new" className="underline-offset-4 hover:underline">
              New quote
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </>
  );
}
