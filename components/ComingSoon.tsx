import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">{title}</h1>
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-tint text-gold-ink">
          <Sparkles aria-hidden size={26} strokeWidth={1.6} />
        </span>
        <p className="text-lg font-semibold">Coming soon</p>
        <p className="mt-1 max-w-sm text-muted">{text}</p>
        <Link href="/dashboard" className="btn-outline mt-6">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
