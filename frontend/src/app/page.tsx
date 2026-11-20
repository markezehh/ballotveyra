'use client'
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function BrandMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10243f] text-white">
      <svg viewBox="0 0 36 36" className="h-6 w-6" aria-hidden="true">
        <path d="M11 18.5 16 23l9-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="18" r="13" fill="none" stroke="currentColor" strokeWidth="2" opacity=".45" />
      </svg>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const showRef = useRef<HTMLDivElement>(null)
  const [isShowing, setIsShowing] = useState(false)

  useEffect(() => {
    const element = showRef.current

    if (!element || typeof IntersectionObserver === "undefined") {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsShowing(true)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.25 })

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfcfa]">
      <header className="relative z-20 border-b border-[#10243f]/8 bg-[#fbfcfa]/95">
        <nav className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-5 sm:px-8" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-3" aria-label="BallotVeyra home">
            <BrandMark />
            <span className="text-[20px] font-bold tracking-tight text-[#10243f]">BallotVeyra</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-semibold text-[#3d4f64] md:flex">
            <Link href="#how-it-works" className="transition-colors hover:text-[#13877d]">How it works</Link>
            <Link href="#privacy" className="transition-colors hover:text-[#13877d]">Privacy</Link>
            <Link href="/help" className="transition-colors hover:text-[#13877d]">Help</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden rounded-lg px-4 py-2.5 text-sm font-bold text-[#10243f] transition-colors hover:bg-[#edf4f3] sm:block">Sign in</Link>
            <Link href="/register" className="flex h-11 items-center gap-2 rounded-lg bg-[#10243f] px-4 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#173454] sm:px-5">
              Get started <ArrowIcon />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero-glow relative">
          <div className="grid-fade absolute inset-0" />
          <div className="relative mx-auto grid min-h-[620px] max-w-[1180px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:py-20">
            <div className="max-w-[590px]">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1aa79a]/20 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#13877d] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#1aa79a]" />
                Private elections, made simple
              </div>
              <h1 className="text-[44px] font-bold leading-[1.06] tracking-[-0.045em] text-[#10243f] sm:text-[58px] lg:text-[68px]">
                Every vote matters.<br />Make it count.
              </h1>
              <p className="mt-7 max-w-[520px] text-lg leading-8 text-[#58687a] sm:text-xl">
                Create secure, private elections for your school, association, or organization—without complicated setup.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="flex h-13 items-center justify-center gap-2 rounded-lg bg-[#1aa79a] px-6 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(26,167,154,.20)] transition-all hover:-translate-y-0.5 hover:bg-[#13877d]">
                  Create an election <ArrowIcon />
                </Link>
                <Link href="#how-it-works" className="flex h-13 items-center justify-center rounded-lg border border-[#10243f]/15 bg-white px-6 text-[15px] font-bold text-[#10243f] transition-colors hover:border-[#10243f]/30 hover:bg-[#f7f9f8]">
                  See how it works
                </Link>
              </div>
              <p className="mt-5 text-sm text-[#7a8794]">No account needed for voters. No credit card required.</p>
            </div>

            <div ref={showRef} className="relative mx-auto w-full overflow-hidden max-w-[510px] lg:mx-0 lg:ml-auto">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#cfece7] blur-2xl" />
              <div  className="ballot-shadow relative rounded-[18px] border border-[#10243f]/10 bg-white p-5 sm:p-7">
                <div className="flex items-start justify-between border-b border-[#10243f]/8 pb-5">
                  <div >
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1aa79a]">Election preview</p>
                    <h2 className="text-xl font-bold tracking-tight text-[#10243f]">Student Council 2026</h2>
                  </div>
                  <span className="rounded-full bg-[#edf8f6] px-3 py-1.5 text-xs font-bold text-[#13877d]">Open</span>
                </div>
                <fieldset className="mt-5 space-y-3">
                  <legend className="mb-3 text-sm font-semibold text-[#58687a]">Who should be your student council president?</legend>
                  {[
                    ["Ezeh Mark", "Candidate for president", true],
                    ["Daniel Ugochi", "Candidate for president", false],
                    ["Sofia Ugwu", "Candidate for president", false],
                  ].map(([name, role, selected],i) => (
                    <label key={String(name)} className={`flex opacity-0 ${i==0 &&isShowing? 'firstOption':i==1 && isShowing?'secondOption':'thirdOption'} cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${selected ? "border-[#1aa79a] bg-[#f4fbf9]" : "border-[#10243f]/10 bg-white hover:border-[#10243f]/25"}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[6px] border-[#1aa79a]" : "border-[#aab4be]"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#10243f]">{String(name)}</span>
                        <span className="mt-0.5 block text-xs text-[#7a8794]">{String(role)}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <button type="button" className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-[#10243f] text-sm font-bold text-white" aria-label="Review selection">Review ballot</button>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-[#10243f]/8 bg-white px-4 py-3 shadow-lg sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf8f6] text-[#13877d]">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true"><path d="m5 10 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <div><p className="text-xs font-bold text-[#10243f]">Ballot submitted</p><p className="mt-0.5 text-[11px] text-[#7a8794]">Privacy protected</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[#10243f]/8 bg-white">
          <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
            <div className="mb-12 max-w-[620px]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#13877d]">From setup to results</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#10243f] sm:text-4xl">Run a complete election in three clear steps.</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                ["01", "Set up your ballot", "Add your title, choices, schedule, and eligible voters in one guided setup."],
                ["02", "Invite your voters", "Download private invitation links and distribute them securely to eligible people."],
                ["03", "Publish the results", "Monitor turnout, close the election, and share one clear aggregate snapshot."],
              ].map(([number, title, copy]) => (
                <article key={number} className="rounded-2xl border border-[#10243f]/8 bg-[#fbfcfa] p-6 sm:p-8">
                  <span className="text-sm font-bold text-[#1aa79a]">{number}</span>
                  <h3 className="mt-8 text-xl font-bold tracking-tight text-[#10243f]">{title}</h3>
                  <p className="mt-3 leading-7 text-[#657487]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="privacy" className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
          <div className="grid items-center gap-10 rounded-[24px] bg-[#10243f] px-6 py-10 text-white sm:px-10 md:grid-cols-[1fr_auto] md:py-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68d4c7]">Built for trust</p>
              <h2 className="mt-3 max-w-[650px] text-3xl font-bold tracking-tight sm:text-4xl">Private by design. Live syncing performance.</h2>
              <p className="mt-4 max-w-[620px] leading-7 text-[#bbc7d3]">Ballots are separated from voter identities, and organizers see only aggregate turnout and published totals.</p>
            </div>
            <Link href="/register" className="flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-[#10243f]">
              Start for free <ArrowIcon />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#10243f]/8 bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-5 py-8 text-sm text-[#718093] sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5"><BrandMark /><span className="font-bold text-[#10243f]">BallotVeyra</span></div>
          <div className="flex gap-5"><Link href="/privacy" className="hover:text-[#10243f]">Privacy</Link><Link href="/terms" className="hover:text-[#10243f]">Terms</Link><Link href="/help" className="hover:text-[#10243f]">Help</Link></div>
        </div>
      </footer>
    </div>
  );
}
