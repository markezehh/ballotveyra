"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Brand } from "@/components/brand";
import { apiRequest } from "@/lib/api";

type Option = { id: string; label: string; description: string | null; imageUrl: string | null };
type Election = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  timeZone: string;
  opensAt: string | null;
  closesAt: string | null;
  options: Option[];
  workspace?: { name: string; slug: string };
};
type Workspace = { name: string; slug: string };

function isOpenForVoting(election: Election) {
  const now = Date.now();
  return election.status === "SCHEDULED"
    && (!election.opensAt || new Date(election.opensAt).getTime() <= now)
    && (!election.closesAt || new Date(election.closesAt).getTime() > now);
}

export function VoterExperience() {
  const { slug } = useParams<{ slug: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [token] = useState(() => typeof window === "undefined"
    ? ""
    : new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"ballot" | "review" | "done">("ballot");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBallot() {
      if (!token) throw new Error("This voting link is invalid or has already been used.");
      try {
        const result = await apiRequest<{ workspace: Workspace; elections: Election[] }>(
          `/api/public/workspaces/${encodeURIComponent(slug)}/access`,
          { method: "POST", body: JSON.stringify({ token }) },
        );
        setWorkspace(result.workspace);
        setElections(result.elections);
      } catch (caught) {
        const status = caught instanceof Error && "status" in caught && typeof caught.status === "number"
          ? caught.status
          : undefined;
        if (status !== 404) throw caught;

        const { election } = await apiRequest<{ election: Election }>(
          `/api/public/elections/${encodeURIComponent(slug)}/access`,
          { method: "POST", body: JSON.stringify({ token }) },
        );
        if (!election.workspace) throw new Error("Unable to load this voting link.");
        setWorkspace(election.workspace);
        setElections([election]);
      }
    }

    loadBallot()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to validate this voting link"))
      .finally(() => setLoading(false));
  }, [slug, token]);

  async function submitBallot() {
    if (!workspace || !token) return;
    const ballots = Object.entries(selected)
      .filter(([, optionId]) => Boolean(optionId))
      .map(([electionId, optionId]) => ({ electionId, optionId }));
    if (ballots.length === 0) return;

    setSubmitting(true);
    setError("");
    try {
      await apiRequest(`/api/public/workspaces/${encodeURIComponent(workspace.slug)}/vote`, {
        method: "POST",
        body: JSON.stringify({ token, ballots }),
      });
      setStep("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit ballot");
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
          <p className="mt-3 leading-7 text-[#6d7b8b]">Thank you for participating. All your selected ballots were submitted together, and this invitation has now been used.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9f8] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[720px]">
        <Brand />
        <section className="mt-6 rounded-2xl border border-[#10243f]/8 bg-white p-5 sm:p-7 ballot-shadow">
          {loading ? (
            <p className="text-sm text-[#8793a1]">Checking voting link…</p>
          ) : !workspace || elections.length === 0 ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error || "This voting link is invalid or has already been used."}
            </p>
          ) : (
            <>
              <div className="border-b border-[#10243f]/8 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#13877d]">Workspace ballot</p>
                <h1 className="mt-2 text-2xl font-bold text-[#10243f]">{workspace.name}</h1>
                <p className="mt-2 text-sm text-[#8793a1]">Choose an option in any elections you wish to vote in. You can return while this link is unused; wait to submit if you plan to vote in an election that is not open yet.</p>
              </div>

              {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              {step === "ballot" ? (
                <>
                  <div className="mt-5 space-y-5">
                    {elections.map((election) => {
                      const open = isOpenForVoting(election);
                      return (
                        <fieldset key={election.id} className="rounded-xl border border-[#10243f]/10 p-4 sm:p-5">
                          <legend className="px-1 text-lg font-bold text-[#10243f]">{election.title}</legend>
                          {election.description && <p className="mt-1 text-sm text-[#8793a1]">{election.description}</p>}
                          <p className="mt-2 text-xs text-[#8793a1]">
                            {open ? `Open for voting · ${election.timeZone}` : `Not currently open for voting · ${election.timeZone}`}
                          </p>
                          {selected[election.id] && (
                            <button
                              type="button"
                              onClick={() => setSelected((current) => {
                                const next = { ...current };
                                delete next[election.id];
                                return next;
                              })}
                              className="mt-2 text-sm font-bold text-[#13877d]"
                            >
                              Clear this election choice
                            </button>
                          )}
                          {open ? (
                            <>
                              <p className="mt-4 text-sm font-semibold text-[#617083]">Select one choice or leave this election blank.</p>
                              <div className="mt-3 space-y-3">
                                {election.options.map((option) => (
                                  <label
                                    key={option.id}
                                    className={`flex min-h-[76px] cursor-pointer items-center gap-3 rounded-xl border p-4 ${selected[election.id] === option.id ? "border-[#1aa79a] bg-[#f4fbf9]" : "border-[#10243f]/12 hover:border-[#10243f]/30"}`}
                                  >
                                    <input
                                      type="radio"
                                      name={`choice-${election.id}`}
                                      value={option.id}
                                      checked={selected[election.id] === option.id}
                                      onChange={() => setSelected((current) => ({ ...current, [election.id]: option.id }))}
                                      className="h-5 w-5 shrink-0 accent-[#1aa79a]"
                                    />
                                    {option.imageUrl && (
                                      <img src={option.imageUrl} alt={`${option.label} candidate`} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                                    )}
                                    <span className="min-w-0 flex-1">
                                      <span className="flex items-center gap-2 font-bold text-[#10243f]">
                                        <span>{option.label}</span>
                                        <img src="/fingerprint.png" alt="" className="h-10 w-14 shrink-0 object-contain" />
                                      </span>
                                      {option.description && <span className="mt-1 block text-sm leading-5 text-[#7a8794]">{option.description}</span>}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p className="mt-4 text-sm text-[#8793a1]">This election is not accepting votes right now.</p>
                          )}
                        </fieldset>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={!Object.values(selected).some(Boolean)}
                    onClick={() => setStep("review")}
                    className="mt-6 h-12 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Review ballot
                  </button>
                </>
              ) : (
                <>
                  <h2 className="mt-5 text-xl font-bold text-[#10243f]">Review your ballot</h2>
                  <p className="mt-2 text-sm leading-6 text-[#8793a1]">
                    Your selected choices will be submitted together. You may leave elections blank, but after submission this link will be disabled and skipped elections cannot be voted later with it.
                  </p>
                  <div className="mt-5 space-y-3">
                    {elections.map((election) => {
                      const choice = election.options.find((option) => option.id === selected[election.id]);
                      return (
                        <div key={election.id} className="rounded-xl border border-[#10243f]/10 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#13877d]">{election.title}</p>
                          <p className="mt-2 font-bold text-[#10243f]">{choice?.label ?? "No vote"}</p>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void submitBallot()}
                    className="mt-6 h-12 w-full rounded-lg bg-[#1aa79a] text-sm font-bold text-white disabled:opacity-60"
                  >
                    {submitting ? "Submitting all ballots…" : "Submit ballot"}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setStep("ballot")}
                    className="mt-3 h-11 w-full rounded-lg text-sm font-bold text-[#617083] disabled:opacity-60"
                  >
                    Go back
                  </button>
                </>
              )}
            </>
          )}
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-[#8793a1]">
          This link is a bearer credential. Keep it private and do not forward it.
        </p>
      </div>
    </main>
  );
}
