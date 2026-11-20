import Image from "next/image";
import Link from "next/link";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const pixels = size === "sm" ? 32 : 36;

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full ${box}`}>
      <Image
        src="/logo1.png"
        alt="BallotVeyra logo"
        width={pixels}
        height={pixels}
        className="h-full w-full object-cover"
        priority
      />
    </div>
  );
}

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="BallotVeyra home">
      <BrandMark />
      <span className={`text-[20px] font-bold tracking-tight ${inverse ? "text-white" : "text-[#10243f]"}`}>BallotVeyra</span>
    </Link>
  );
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
