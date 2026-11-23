"use client";

import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { apiRequest } from "@/lib/api";

type Option = { id: string; label: string; description: string | null };
type Election = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  timeZone: string;
  opensAt: string | null;
  closesAt: string | null;
  workspace: { name: string; slug: string };
  options: Option[];
};

export function VoterExperience() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionSlug, setSelectedElectionSlug] = useState("");
  const [selected, setSelected] = useState("");
  const [step, setStep] = useState<"ballot" | "review" | "done">("ballot");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    apiRequest<{ elections: Election[] }>("/api/public/elections")
      .then(({ elections }) => {
        setElections(elections);
        console.log('Elections:',elections)
        const hashSlug = new URLSearchParams(window.location.search).get("election");
        const scheduledElections = elections.filter((election) => election.status === "SCHEDULED");
        const preferred =
          scheduledElections.find((election) => election.slug === hashSlug) ??
          scheduledElections[0] ??
          elections.find((election) => election.slug === hashSlug) ??
          elections[0];
        if (preferred) setSelectedElectionSlug(preferred.slug);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load elections"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const scheduledElections = elections.filter((item) => item.status === "SCHEDULED");
  const election = elections.find((item) => item.slug === selectedElectionSlug);
  const opensAtTime = election?.opensAt ? new Date(election.opensAt).getTime() : Number.NaN;
  const closesAtTime = election?.closesAt ? new Date(election.closesAt).getTime() : Number.NaN;
  const remainingMs = Number.isFinite(opensAtTime) ? opensAtTime - now : 0;
  const closingRemainingMs = Number.isFinite(closesAtTime) ? closesAtTime - now : 0;
  const votingNotOpen = remainingMs > 0;
  const votingClosed =
    election?.status === "CLOSED" ||
    election?.status === "PUBLISHED" ||
    (election?.status === "SCHEDULED" && Number.isFinite(closesAtTime) && closingRemainingMs <= 0);
  const countdown = {
    days: Math.floor(remainingMs / 86_400_000),
    hours: Math.floor((remainingMs % 86_400_000) / 3_600_000),
    minutes: Math.floor((remainingMs % 3_600_000) / 60_000),
    seconds: Math.floor((remainingMs % 60_000) / 1000),
  };
  const closingCountdown = {
    days: Math.max(0, Math.floor(closingRemainingMs / 86_400_000)),
    hours: Math.max(0, Math.floor((closingRemainingMs % 86_400_000) / 3_600_000)),
    minutes: Math.max(0, Math.floor((closingRemainingMs % 3_600_000) / 60_000)),
    seconds: Math.max(0, Math.floor((closingRemainingMs % 60_000) / 1000)),
  };

  async function submitBallot() {
    if (!election || !selected) return;

    setSubmitting(true);
    setError("");
    try {
      await apiRequest(`/api/public/elections/${encodeURIComponent(election.slug)}/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId: selected }),
      });
      setStep("done");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to submit ballot";
      setError(
        message === "The election has reached its eligible voter ballot limit"
          ? "Maximum number of votes reached for eligible voters"
          : message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9f8] px-5">
        <section className="w-full max-w-[480px] rounded-2xl border border-[#10243f]/8 bg-white p-7 text-center ballot-shadow">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf8f6] text-[#13877d]">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 7" /></svg>
          </div>
          <h1 className="mt-5 text-2xl font-bold text-[#10243f]">Your ballot was submitted</h1>
          <p className="mt-3 leading-7 text-[#6d7b8b]">Thank you for participating. Your vote has been recorded.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9f8] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[520px]">
        <Brand />
        <section className="mt-6 rounded-2xl border border-[#10243f]/8 bg-white p-5 sm:p-7 ballot-shadow">
          {loading ? (
            <p className="text-sm text-[#8793a1]">Loading election…</p>
          ) : !election ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">No active real elections are available.</p>
          ) : (
            <>
              {scheduledElections.length > 1 && (
                <label className="mb-5 block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#8793a1]">Election</span>
                  <select value={selectedElectionSlug} onChange={(event) => { setSelectedElectionSlug(event.target.value); setSelected(""); setStep("ballot"); }} className="h-11 w-full rounded-lg border border-[#10243f]/15 px-3 text-sm font-bold text-[#10243f]">
                    {scheduledElections.map((item) => (
                      <option key={item.id} value={item.slug}>{item.title}</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="border-b border-[#10243f]/8 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#13877d]">Private election</p>
                <h1 className="mt-2 text-2xl font-bold text-[#10243f]">{election.title}</h1>
                {election.description && <p className="mt-2 text-sm text-[#8793a1]">{election.description}</p>}
                <p className="mt-2 text-sm text-[#8793a1]">{election.workspace.name} · {election.timeZone}</p>
              </div>

              {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              {votingNotOpen ? (
                <div className="mt-6 rounded-xl border border-[#1aa79a]/30 bg-[#f4fbf9] p-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#13877d]">Voting opens in</p>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[
                      [countdown.days, "Days"],
                      [countdown.hours, "Hours"],
                      [countdown.minutes, "Minutes"],
                      [countdown.seconds, "Seconds"],
                    ].map(([value, label]) => (
                      <div key={String(label)} className="rounded-lg border border-[#10243f]/8 bg-white px-1 py-3">
                        <p className="text-2xl font-bold tabular-nums text-[#10243f]">{String(value).padStart(2, "0")}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase text-[#8793a1]">{label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-[#8793a1]">
                    Opens {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: election.timeZone }).format(new Date(election.opensAt!))}
                  </p>
                </div>
              ) : votingClosed ? (
                <div className="mt-6 rounded-xl border border-[#d9534f]/30 bg-[#f9ebea] p-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d9534f]">Voting closed</p>
                  {election.closesAt && (
                    <p className="mt-3 text-sm text-[#8793a1]">
                      Closed {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: election.timeZone }).format(new Date(election.closesAt))}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {Number.isFinite(closesAtTime) && closingRemainingMs > 0 && (
                    <div className="mt-6 rounded-xl border border-[#13877d]/20 bg-[#edf8f6] p-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#13877d]">Voting closes in</p>
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {[
                          [closingCountdown.days, "Days"],
                          [closingCountdown.hours, "Hours"],
                          [closingCountdown.minutes, "Minutes"],
                          [closingCountdown.seconds, "Seconds"],
                        ].map(([value, label]) => (
                          <div key={String(label)} className="rounded-lg border border-[#10243f]/8 bg-white px-1 py-2">
                            <p className="text-xl font-bold tabular-nums text-[#10243f]">{String(value).padStart(2, "0")}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase text-[#8793a1]">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === "ballot" ? (
                    <>
                      <fieldset className="mt-5">
                        <legend className="text-base font-bold text-[#10243f]">Select your choice</legend>
                        <p className="mt-1 text-sm text-[#8793a1]">Select one option.</p>
                        <div className="mt-5 space-y-3">
                          {election.options.map((option) => (
                            <label
                              key={option.id}
                              className={`flex min-h-[76px] md:pr-20 cursor-pointer items-center gap-3 rounded-xl border p-4 ${selected === option.id ? "border-[#1aa79a] bg-[#f4fbf9]" : "border-[#10243f]/12 hover:border-[#10243f]/30"}`}
                            >
                              <input type="radio" name="choice" value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} className="h-5 w-5 shrink-0 accent-[#1aa79a]" />
                              <span className="min-w-0 flex-1">
                                <span className="block font-bold text-[#10243f]">{option.label}</span>
                                {option.description && <span className="mt-1 block text-sm leading-5 text-[#7a8794]">{option.description}</span>}
                              </span>
                              {selected === option.id && (
                                <img src="/fingerprint.png" alt="" className="h-12 w-14 md:h-15 md:w-20 shrink-0 object-contain" />
                              )}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <button type="button" disabled={!selected} onClick={() => setStep("review")} className="mt-6 h-12 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Review ballot</button>
                    </>
                  ) : (
                    <>
                      <h2 className="mt-5 text-xl font-bold text-[#10243f]">Review your choice</h2>
                      <p className="mt-2 text-sm leading-6 text-[#8793a1]">Confirm your choice before submitting. You cannot edit or replace this ballot afterward.</p>
                      <div className="mt-5 rounded-xl border border-[#1aa79a]/30 bg-[#f4fbf9] p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#13877d]">Your choice</p>
                        <p className="mt-2 font-bold text-[#10243f]">{election.options.find((option) => option.id === selected)?.label}</p>
                      </div>
                      <button type="button" disabled={submitting} onClick={() => void submitBallot()} className="mt-6 h-12 w-full rounded-lg bg-[#1aa79a] text-sm font-bold text-white disabled:opacity-60">{submitting ? "Submitting…" : "Submit my ballot"}</button>
                      <button type="button" onClick={() => setStep("ballot")} className="mt-3 h-11 w-full rounded-lg text-sm font-bold text-[#617083]">Go back</button>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default VoterExperience;
