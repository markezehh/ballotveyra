"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { apiRequest } from "@/lib/api";

export default function ElectionDetailPage() {
  const [id, setId] = useState("");
  const [account, setAccount] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [election, setElection] = useState<any>(null);
  const [tab, setTab] = useState("Overview");
  const [status, setStatus] = useState("");
  const[isActivating, setIsActivating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [tally, setTally] = useState<any>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState("");
  const [windowOpen, setWindowOpen] = useState("");
  const [windowClose, setWindowClose] = useState("");
  const [savingWindow, setSavingWindow] = useState(false);

  useEffect(() => {
    setId(decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() ?? ""));
  }, []);

  async function loadResults(silent = false) {
    if (!silent) setResultsLoading(true);
    setResultsError("");
    try {
      const results = await apiRequest<{ tally: any }>(`/api/elections/${id}/results`);
      setTally(results.tally);
    } catch (caught) {
      setResultsError(caught instanceof Error ? caught.message : "Unable to load results");
    } finally {
      if (!silent) setResultsLoading(false);
    }
  }

  function resultsAreAvailable(electionData: any) {
    return electionData?.status === "CLOSED" || electionData?.status === "PUBLISHED";
  }

  async function load() {
    setLoading(true);
    try {
      const [me, workspaces, detail] = await Promise.all([
        apiRequest<{ account: any }>("/api/auth/me"),
        apiRequest<{ workspaces: any[] }>("/api/workspaces"),
        apiRequest<{ election: any }>(`/api/elections/${id}`),
      ]);
      setAccount(me.account);
      setWorkspace(workspaces.workspaces[0] ?? null);
      setElection(detail.election);
      setWindowOpen(toDateTimeLocal(detail.election.opensAt, detail.election.timeZone));
      setWindowClose(toDateTimeLocal(detail.election.closesAt, detail.election.timeZone));
      setTally(null);
      if (resultsAreAvailable(detail.election)) await loadResults();
    } catch (caught) { setStatus(caught instanceof Error ? caught.message : "Unable to load election"); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (id) load(); }, [id]);

  useEffect(() => {
    if (!id) return;

    async function refreshElection() {
      if (document.visibilityState !== "visible") return;
      try {
        const detail = await apiRequest<{ election: any }>(`/api/elections/${id}`);
        setElection(detail.election);
        console.log('Refreshed election:', detail.election);
        if (tab === "Results" && resultsAreAvailable(detail.election)) {
          await loadResults(true);
        }
      } catch (caught) {
        setStatus(caught instanceof Error ? caught.message : "Unable to refresh election");
      }
    }

    const intervalId = window.setInterval(refreshElection, 3000);
    return () => window.clearInterval(intervalId);
  }, [id, tab]);

  async function activate() {
    setIsActivating(true);
    try { const data = await apiRequest<{ election: any }>(`/api/elections/${id}/activate`, { method: "POST" }); setElection(data.election); setStatus("Election activated."); }
    catch (caught) { setStatus(caught instanceof Error ? caught.message : "Unable to activate election"); }
    finally { setIsActivating(false); }
  }

  async function closeElection() {
    if (!confirm("Close this election now?")) return;
    try {
      const data = await apiRequest<{ election: any }>(`/api/elections/${id}/close`, { method: "POST" });
      setElection(data.election);
      setStatus("Election closed.");
      setTab("Results");
      await loadResults();
    } catch (caught) { setStatus(caught instanceof Error ? caught.message : "Unable to close election"); }
  }

  async function importVoters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const emails = String(formData.get("voters") ?? "")
      .split(/\n|,/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (!emails.length) { setStatus("Enter at least one voter email."); return; }

    const invalid = emails.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (invalid) { setStatus(`Invalid email address: ${invalid}`); return; }

    const uniqueEmails = Array.from(new Set(emails));
    if (uniqueEmails.length !== emails.length) { setStatus("Remove duplicate email addresses before importing."); return; }

    const rows = uniqueEmails.map((email) => ({ voterKey: email, email, displayName: email.split("@")[0] }));
    setImporting(true);
    try {
      const result = await apiRequest<{ accepted: number; rejected: number }>(`/api/elections/${id}/voters`, { method: "POST", body: JSON.stringify({ rows }) });
      setStatus(result.rejected ? `${result.accepted} voters imported; ${result.rejected} already existed.` : `${result.accepted} voters imported.`);
      await load();
      form.reset();
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Unable to import voters");
    } finally {
      setImporting(false);
    }
  }

  function toDateTimeLocal(value: string | null, timeZone: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
  }

  async function saveVotingWindow() {
    setSavingWindow(true);
    setStatus("");
    try {
      const data = await apiRequest<{ election: any }>(`/api/elections/${id}/voting-window`, {
        method: "PATCH",
        body: JSON.stringify({
          opensAt: windowOpen || null,
          closesAt: windowClose || null,
        }),
      });
      setElection(data.election);
      setWindowOpen(toDateTimeLocal(data.election.opensAt, data.election.timeZone));
      setWindowClose(toDateTimeLocal(data.election.closesAt, data.election.timeZone));
      setStatus("Voting window updated.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Unable to update voting window");
    } finally {
      setSavingWindow(false);
    }
  }

  const turnout = election?.eligibleCount ? (election.ballotsCast / election.eligibleCount) * 100 : 0;

  return <DashboardShell title="Election" account={account} workspace={workspace}>
    {loading ? <p className="text-sm text-[#8793a1]">Loading election…</p> : !election ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{status || "Election not found"}</p> : <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold"><Link href="/dashboard" className="text-[#8793a1]">Elections</Link><span className="text-[#bec5cc]">/</span><span className="text-[#13877d]">{election.status}</span></div><h1 className="text-3xl font-bold tracking-tight text-[#10243f]">{election.title}</h1><p className="mt-2 text-sm text-[#8793a1]">{election.slug} · {election.timeZone}</p></div>{election.status === "DRAFT" ? <button type="button" onClick={activate} disabled={isActivating} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1aa79a] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">{isActivating ? <><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span>Activating…</span></> : "Activate election"}</button> : election.status === "SCHEDULED" ? <button type="button" onClick={closeElection} className="h-11 rounded-lg border border-[#10243f]/15 bg-white px-4 text-sm font-bold text-[#10243f]">Close election early</button> : null}</div>
      {status && <p role="status" className="mt-5 rounded-lg bg-[#edf4f3] px-4 py-3 text-sm font-bold text-[#4e6478]">{status}</p>}
      {election.eligibleCount !== undefined && <h3 className="text-lg font-bold text-[#10243f]">Total voters: {election.eligibleCount}</h3>}
      <nav className="mt-8 flex gap-6 overflow-x-auto border-b border-[#10243f]/8" aria-label="Election sections">{["Overview", "Ballot", "Voters", "Results"].map((name) => <button key={name} type="button" onClick={() => { setTab(name); if (name === "Results" && resultsAreAvailable(election)) void loadResults(); }} className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-bold ${tab === name ? "border-[#1aa79a] text-[#10243f]" : "border-transparent text-[#8793a1]"}`}>{name}</button>)}</nav>
      {tab === "Overview" && <><div className="mt-7 grid gap-5 lg:grid-cols-[1fr_320px]"><section className="rounded-xl border border-[#10243f]/8 bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-[#10243f]">Turnout</h2><span className="text-xs font-semibold text-green-500 animate-pulse">{election.status === 'SCHEDULED' && 'Live'}</span></div><div className="mt-6 flex items-end gap-3"><p className="text-4xl font-bold text-[#10243f]">{election.ballotsCast}</p><p className="mb-1 text-sm text-[#8793a1]">of {election.eligibleCount} eligible</p></div><div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#edf0f3]"><div className="h-full rounded-full bg-[#1aa79a]" style={{ width: `${Math.min(turnout, 100)}%` }} /></div><p className="mt-3 text-sm font-bold text-[#13877d]">{isNaN(turnout) ? "0.0" : turnout.toFixed(1)}% turnout</p></section><aside className="rounded-xl border border-[#10243f]/8 bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Voting window</p>{election.status === "DRAFT" ? <div className="mt-5 space-y-4"><label className="block"><span className="block text-xs text-[#8793a1]">Opens</span><input type="datetime-local" value={windowOpen} onChange={(event) => setWindowOpen(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#10243f]/15 px-3 text-sm text-[#10243f]" /></label><label className="block"><span className="block text-xs text-[#8793a1]">Closes</span><input type="datetime-local" value={windowClose} onChange={(event) => setWindowClose(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#10243f]/15 px-3 text-sm text-[#10243f]" /></label><button type="button" onClick={() => void saveVotingWindow()} disabled={savingWindow} className="h-10 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{savingWindow ? "Saving…" : "Save voting window"}</button></div> : <div className="mt-5 space-y-4 text-sm"><div><p className="text-xs text-[#8793a1]">Opens</p><p className="mt-1 font-bold text-[#10243f]">{election.opensAt ? new Date(election.opensAt).toLocaleString() : "Not set"}</p></div><div><p className="text-xs text-[#8793a1]">Closes</p><p className="mt-1 font-bold text-[#10243f]">{election.closesAt ? new Date(election.closesAt).toLocaleString() : "Not set"}</p></div></div>}</aside></div><section className="mt-5 rounded-xl border border-[#10243f]/8 bg-white p-6"><h2 className="text-lg font-bold text-[#10243f]">Setup checklist</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[Boolean(election.options?.length), "Ballot configured"],[Boolean(election.eligibleCount), "Voters imported"],[election.status !== "DRAFT", "Election activated"],[election.status === "CLOSED" || election.status === "PUBLISHED", "Election closed"]].map(([done, label]) => <div key={String(label)} className="flex items-center gap-3 rounded-lg bg-[#f7f9f8] p-4"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-[#edf8f6] text-[#13877d]" : "bg-[#edf0f3] text-[#8793a1]"}`}>{done ? "✓" : "○"}</span><span className="text-sm font-bold text-[#617083]">{String(label)}</span></div>)}</div></section></>}
      {tab === "Ballot" && <section className="mt-6 rounded-xl border border-[#10243f]/8 bg-white p-6"><h2 className="text-lg font-bold text-[#10243f]">Ballot choices</h2><div className="mt-4 space-y-3">{election.options?.map((option: any, index: number) => <div key={option.id} className="rounded-lg border border-[#10243f]/8 px-4 py-3 text-sm font-bold text-[#10243f]"><span className="mr-3 text-[#8793a1]">{index + 1}</span>{option.label}</div>)}</div></section>}
      {tab === "Voters" && <section className="mt-6 rounded-xl border border-[#10243f]/8 bg-white p-6"><h2 className="text-lg font-bold text-[#10243f]">Import eligible voters</h2><p className="mt-1 text-sm text-[#8793a1]">Enter one email per line. Available for draft elections only.</p><form onSubmit={importVoters} className="mt-5"><textarea name="voters" disabled={election.status !== "DRAFT"} rows={8} placeholder={`voter@example.org\nanother@example.org`} className="w-full rounded-lg border border-[#10243f]/15 p-4 text-sm disabled:bg-[#edf0f3]"/><button type="submit" disabled={election.status !== "DRAFT" || importing} className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#10243f] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{importing ? <><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/><span>Importing…</span></> : "Import voters"}</button></form></section>}
      {tab === "Results" && <section className="mt-6 rounded-xl border border-[#10243f]/8 bg-white p-6">
        <h2 className="text-lg font-bold text-[#10243f]">Live tally</h2>
        {!resultsAreAvailable(election) ? (
          <p className="mt-4 text-sm text-[#8793a1]">Results appear after the election is closed or published.</p>
        ) : resultsLoading ? (
          <p className="mt-5 text-sm text-[#8793a1]">Loading results…</p>
        ) : resultsError ? (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{resultsError}</p>
        ) : tally ? (
          <div className="mt-5 space-y-4">
            {(tally.options ?? []).map((option: any) => (
              <div key={option.id}>
                <div className="mb-2 flex justify-between text-sm font-bold text-[#10243f]"><span>{option.label}</span><span>{option.count ?? 0}</span></div>
                <div className="h-3 rounded-full bg-[#edf0f3]"><div className="h-full rounded-full bg-[#1aa79a]" style={{ width: `${tally.ballotsCast ? ((option.count ?? 0) / tally.ballotsCast) * 100 : 0}%` }} /></div>
              </div>
            ))}
            <p className="pt-2 text-sm text-[#8793a1]">{tally.ballotsCast ?? 0} ballots cast</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#8793a1]">No results are available yet.</p>
        )}
      </section>}
    </>}
  </DashboardShell>;
}
