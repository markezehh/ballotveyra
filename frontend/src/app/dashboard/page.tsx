"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { apiRequest } from "@/lib/api";

type Election = {
  id: string;
  slug: string;
  title: string;
  statusLabel: string;
  eligibleCount: number;
  ballotsCast: number;
};

export default function DashboardPage() {
  const [account, setAccount] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiRequest<{ account: any }>("/api/auth/me"),
      apiRequest<{ workspaces: any[] }>("/api/workspaces"),
      apiRequest<{ elections: Election[] }>("/api/elections"),
    ])
      .then(([me, workspaceData, electionData]) => {
        setAccount(me.account);
        setWorkspace(workspaceData.workspaces[0] ?? null);
        setElections(electionData.elections);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load dashboard"))
      .finally(() => setLoading(false));

    async function refreshElections() {
      if (document.visibilityState !== "visible") return;
      try {
        const electionData = await apiRequest<{ elections: Election[] }>("/api/elections");
        setElections(electionData.elections);
        console.log('Refreshed elections:', electionData.elections);
        setError("");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to refresh elections");
      }
    }

    const intervalId = window.setInterval(refreshElections, 3000);
    return () => window.clearInterval(intervalId);
  }, []);

  const visible = useMemo(
    () =>
      elections.filter((election) => {
        if (filter === "Active") return ["Open", "Scheduled", "Published"].includes(election.statusLabel);
       // console.log('Filtering elections with filter:', filter, 'Election status:', election.statusLabel);
        if (filter === "Closed") return election.statusLabel === "Closed";
        return true;
      }),
    [elections, filter]
  );

  const active = elections.filter((election) => ["Open", "Scheduled", "Published"].includes(election.statusLabel)).length;
  const ballots = elections.reduce((sum, election) => sum + election.ballotsCast, 0);
  const eligible = elections.reduce((sum, election) => sum + election.eligibleCount, 0);
  const firstName = account?.firstName || "there";

  return (
    <DashboardShell title="Elections" account={account} workspace={workspace}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {workspace && <p className="text-sm font-semibold text-[#7a8794]">{workspace.name}</p>}
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#10243f]">Good morning, {firstName}</h1>
        </div>
        <Link
          href="/dashboard/elections/new"
          className="flex h-11 items-center justify-center rounded-lg bg-[#1aa79a] px-5 text-sm font-bold text-white hover:bg-[#13877d]"
        >
          + Create election
        </Link>
      </div>
      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#10243f]/8 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Active elections</p>
          <p className="mt-3 text-3xl font-bold text-[#10243f]">{loading ? "—" : active}</p>
        </div>
        <div className="rounded-xl border border-[#10243f]/8 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Ballots cast</p>
          <p className="mt-3 text-3xl font-bold text-[#10243f]">{loading ? "—" : ballots}</p>
        </div>
        <div className="rounded-xl border border-[#10243f]/8 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Eligible voters</p>
          <p className="mt-3 text-3xl font-bold text-[#10243f]">{loading ? "—" : eligible}</p>
        </div>
      </div>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#10243f]">All elections</h2>
          <div className="flex rounded-lg border border-[#10243f]/10 bg-white p-1 text-xs font-bold">
            {["All", "Active", "Closed"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setFilter(name)}
                className={`rounded-md px-3 py-1.5 ${filter === name ? "bg-[#edf4f3] text-[#10243f]" : "text-[#8793a1]"}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#10243f]/8 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="border-b border-[#10243f]/8 text-xs uppercase tracking-[0.08em] text-[#8793a1]">
                <tr>
                  <th className="px-5 py-4 font-bold">Election</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Turnout</th>
                  <th className="px-5 py-4 font-bold">Eligible</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#8793a1]">
                      Loading elections…
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <p className="font-bold text-[#10243f]">No elections yet</p>
                      <Link
                        href="/dashboard/elections/new"
                        className="mt-2 inline-block text-sm font-bold text-[#13877d]"
                      >
                        Create your first election
                      </Link>
                    </td>
                  </tr>
                ) : (
                  visible.map((election) => (
                    <tr key={election.id} className="border-b border-[#10243f]/6 last:border-0">
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/elections/${election.id}`}
                          className="font-bold text-[#10243f] hover:text-[#13877d]"
                        >
                          {election.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            election.statusLabel === "Open"
                              ? "bg-[#edf8f6] text-[#13877d]"
                              : election.statusLabel === "Draft"
                              ? "bg-[#edf0f3] text-[#617083]"
                              : election.statusLabel === "Published"
                              ? "bg-[#eef0ff] text-[#5962a9]"
                              : "bg-[#fff5df] text-[#9a7021]"
                          }`}
                        >
                          {election.statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#617083]">
                        {election.ballotsCast} / {election.eligibleCount}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#617083]">{election.eligibleCount}</td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/dashboard/elections/${election.id}`} className="text-sm font-bold text-[#13877d]">
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
