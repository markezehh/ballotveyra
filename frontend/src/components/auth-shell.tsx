import Link from "next/link";
import { Brand } from "./brand";

export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_440px]">
      <section className="hidden min-h-screen bg-[#10243f] p-10 lg:flex lg:flex-col">
        <Brand inverse />
        <div className="my-auto max-w-[520px]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68d4c7]">Private elections</p>
          <h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight text-white">Clear voting.<br />Trusted results.</h1>
          <p className="mt-6 max-w-[460px] text-lg leading-8 text-[#bdc9d5]">Give every eligible voter a private path to the ballot—and every organizer a clear view of turnout.</p>
        </div>
        <p className="text-xs text-[#8395a7]">© 2026 BallotVeyra</p>
      </section>
      <section className="flex min-h-screen flex-col bg-white px-5 py-7 sm:px-10">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="my-auto w-full max-w-[360px] lg:mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-[#10243f]">{title}</h2>
          <p className="mt-2 leading-7 text-[#6d7b8b]">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
        <div className="mt-8 text-center text-xs text-[#8a96a3]">
          <Link href="/privacy" className="hover:text-[#10243f]">Privacy</Link>
          <span className="mx-3">·</span>
          <Link href="/help" className="hover:text-[#10243f]">Help</Link>
        </div>
      </section>
    </main>
  );
}
