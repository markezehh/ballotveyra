import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";

const elections = [
  ["Student Council President", "Open", "218 / 300", "67", "student-council-president"],
  ["Board Chair 2026", "Scheduled", "—", "142", "board-chair-2026"],
  ["Alumni Grant Committee", "Draft", "—", "48", "alumni-grant"],
  ["Regional Meetup Hosts", "Published", "96 / 120", "80", "regional-meetup-hosts"],
];

export default function DashboardPage() {
  return <DashboardShell title="Elections">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-[#7a8794]">Northbridge Alumni</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[#10243f]">Good morning, Amara</h1></div><Link href="/dashboard/elections/new" className="flex h-11 items-center justify-center rounded-lg bg-[#1aa79a] px-5 text-sm font-bold text-white hover:bg-[#13877d]">+ Create election</Link></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-[#10243f]/8 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Active elections</p><p className="mt-3 text-3xl font-bold text-[#10243f]">2</p></div><div className="rounded-xl border border-[#10243f]/8 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Ballots cast</p><p className="mt-3 text-3xl font-bold text-[#10243f]">314</p></div><div className="rounded-xl border border-[#10243f]/8 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Eligible voters</p><p className="mt-3 text-3xl font-bold text-[#10243f]">610</p></div></div>
    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-[#10243f]">All elections</h2><div className="flex rounded-lg border border-[#10243f]/10 bg-white p-1 text-xs font-bold"><button className="rounded-md bg-[#edf4f3] px-3 py-1.5 text-[#10243f]">All</button><button className="px-3 py-1.5 text-[#8793a1]">Active</button><button className="px-3 py-1.5 text-[#8793a1]">Closed</button></div></div>
      <div className="overflow-hidden rounded-xl border border-[#10243f]/8 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="border-b border-[#10243f]/8 text-xs uppercase tracking-[0.08em] text-[#8793a1]"><tr><th className="px-5 py-4 font-bold">Election</th><th className="px-5 py-4 font-bold">Status</th><th className="px-5 py-4 font-bold">Turnout</th><th className="px-5 py-4 font-bold">Eligible</th><th className="px-5 py-4" /></tr></thead><tbody>{elections.map(([title,status,turnout,eligible,id]) => <tr key={id} className="border-b border-[#10243f]/6 last:border-0"><td className="px-5 py-4"><Link href={`/dashboard/elections/${id}`} className="font-bold text-[#10243f] hover:text-[#13877d]">{title}</Link></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status === "Open" ? "bg-[#edf8f6] text-[#13877d]" : status === "Draft" ? "bg-[#edf0f3] text-[#617083]" : status === "Published" ? "bg-[#eef0ff] text-[#5962a9]" : "bg-[#fff5df] text-[#9a7021]"}`}>{status}</span></td><td className="px-5 py-4 text-sm text-[#617083]">{turnout}</td><td className="px-5 py-4 text-sm text-[#617083]">{eligible}</td><td className="px-5 py-4 text-right"><Link href={`/dashboard/elections/${id}`} className="text-sm font-bold text-[#13877d]">Manage →</Link></td></tr>)}</tbody></table></div></div>
    </section>
  </DashboardShell>;
}
