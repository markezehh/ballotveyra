import Link from "next/link";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl";
  const icon = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div className={`flex shrink-0 items-center justify-center bg-[#10243f] text-white ${box}`}>
      <svg viewBox="0 0 36 36" className={icon} aria-hidden="true">
        <path d="M11 18.5 16 23l9-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="18" r="13" fill="none" stroke="currentColor" strokeWidth="2" opacity=".45" />
      </svg>
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
