import Link from "next/link";
import { Brand } from "@/components/brand";

export const instant = false;

export default async function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const options = [["Amara Okafor", 128, 58.7], ["Daniel Mensah", 62, 28.4], ["Sofia Reyes", 28, 12.9]];
  return (
    <main className="min-h-screen bg-[#fbfcfa]">
      <header className="border-b border-[#10243f]/8 bg-white">
        <div className="mx-auto flex h-20 max-w-[1000px] items-center justify-between px-5 sm:px-8">
          <Brand />
          <Link href="/" className="text-sm font-bold text-[#13877d]">
            BallotVeyra
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-[1000px] px-5 py-12 sm:px-8">
        <div className="rounded-[20px] bg-[#10243f] px-6 py-8 text-white sm:px-9">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#68d4c7]">Published results</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Student Council President</h1>
          <p className="mt-3 text-sm text-[#bbc7d3]">Northbridge Alumni · Closed Nov 21, 5:00 PM WAT</p>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl border border-[#10243f]/8 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Ballots cast</p>
            <p className="mt-3 text-3xl font-bold text-[#10243f]">218</p>
          </div>
          <div className="rounded-xl border border-[#10243f]/8 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Turnout</p>
            <p className="mt-3 text-3xl font-bold text-[#10243f]">72.7%</p>
          </div>
          <div className="rounded-xl border border-[#10243f]/8 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Winner</p>
            <p className="mt-3 text-lg font-bold text-[#10243f]">Amara Okafor</p>
          </div>
        </div>
        <section className="mt-6 rounded-xl border border-[#10243f]/8 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#10243f]">Ballot totals</h2>
          <div className="mt-6 space-y-6">
            {options.map(([name, count, percentage], index) => (
              <div key={String(name)}>
                <div className="mb-2 flex items-end justify-between">
                  <div>
                    <span className="mr-2 text-xs font-bold text-[#8793a1]">0{index + 1}</span>
                    <span className="font-bold text-[#10243f]">{String(name)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#10243f]">{String(count)}</span>
                    <span className="ml-2 text-sm text-[#8793a1]">{String(percentage)}%</span>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#edf0f3]">
                  <div className="h-full rounded-full bg-[#1aa79a]" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-[#10243f]/8 pt-6 sm:flex-row sm:justify-end">
            <button type="button" className="h-11 rounded-lg border border-[#10243f]/15 px-4 text-sm font-bold text-[#10243f]">
              Print results
            </button>
            <button type="button" className="h-11 rounded-lg bg-[#10243f] px-4 text-sm font-bold text-white">
              Download CSV
            </button>
          </div>
        </section>
        <p className="mt-5 text-center text-xs text-[#8793a1]">Election: {slug} · Aggregate results only</p>
      </section>
    </main>
  );
}
