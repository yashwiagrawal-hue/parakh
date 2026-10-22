import Link from "next/link";

export default function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`font-serif text-[1.7rem] leading-none text-forest ${className}`} aria-label="Parakh home">
      Parakh
    </Link>
  );
}
