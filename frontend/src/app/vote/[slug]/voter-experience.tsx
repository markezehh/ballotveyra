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
  workspace: { name: string; slug: string };
  options: Option[];
};

export function VoterExperience() {
  const { slug } = useParams<{ slug: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [token] = useState(() => typeof window === "undefined"
    ? ""
    : new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  const [selected, setSelected] = useState("");
  const [step, setStep] = useState<"ballot" | "review" | "done">("ballot");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const accessRequest = token
      ? apiRequest<{ election: Election }>(`/api/public/elections/${encodeURIComponent(slug)}/access`, {
          method: "POST",
          body: JSON.stringify({ token }),
        })
      : Promise.reject(new Error("This voting link is invalid or has already been used."));
    accessRequest
      .then(({ election: authorizedElection }) => setElection(authorizedElection))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to validate this voting link"))
      .finally(() => setLoading(false));
  }, [slug, token]);

  async function submitBallot() {
    if (!election || !selected) return;

    setSubmitting(true);
    setError("");
    try {
      await apiRequest(`/api/public/elections/${encodeURIComponent(election.slug)}/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId: selected, token }),
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
          <p className="mt-3 leading-7 text-[#6d7b8b]">Thank you for participating. This invitation has now been used.</p>
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
            <p className="text-sm text-[#8793a1]">Checking voting link…</p>
          ) : !election ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error || "This voting link is invalid or has already been used."}
            </p>
          ) : (
            <>
              <div className="border-b border-[#10243f]/8 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#13877d]">Private election</p>
                <h1 className="mt-2 text-2xl font-bold text-[#10243f]">{election.title}</h1>
                {election.description && <p className="mt-2 text-sm text-[#8793a1]">{election.description}</p>}
                <p className="mt-2 text-sm text-[#8793a1]">{election.workspace.name} · {election.timeZone}</p>
              </div>

              {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              {step === "ballot" ? (
                <>
                  <fieldset className="mt-5">
                    <legend className="text-base font-bold text-[#10243f]">Select your choice</legend>
                    <p className="mt-1 text-sm text-[#8793a1]">Select one option.</p>
                    <div className="mt-5 space-y-3">
                      {election.options.map((option) => (
                        <label
                          key={option.id}
                          className={`flex min-h-[76px] cursor-pointer items-center gap-3 rounded-xl border p-4 ${selected === option.id ? "border-[#1aa79a] bg-[#f4fbf9]" : "border-[#10243f]/12 hover:border-[#10243f]/30"}`}
                        >
                          <input
                            type="radio"
                            name="choice"
                            value={option.id}
                            checked={selected === option.id}
                            onChange={() => setSelected(option.id)}
                            className="h-5 w-5 shrink-0 accent-[#1aa79a]"
                          />
                          {option.imageUrl && (
                            <img
                              src={option.imageUrl}
                              alt={`${option.label} candidate`}
                              className="h-14 w-14 shrink-0 rounded-full object-cover"
                            />
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
                  </fieldset>
                  <button
                    type="button"
                    disabled={!selected}
                    onClick={() => setStep("review")}
                    className="mt-6 h-12 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Review ballot
                  </button>
                </>
              ) : (
                <>
                  <h2 className="mt-5 text-xl font-bold text-[#10243f]">Review your choice</h2>
                  <p className="mt-2 text-sm leading-6 text-[#8793a1]">Confirm your choice before submitting. You cannot edit or replace this ballot afterward.</p>
                  <div className="mt-5 rounded-xl border border-[#1aa79a]/30 bg-[#f4fbf9] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#13877d]">Your choice</p>
                    <div className="mt-2 flex items-center gap-3">
                      {election.options.find((option) => option.id === selected)?.imageUrl && (
                        <img
                          src={election.options.find((option) => option.id === selected)?.imageUrl ?? ""}
                          alt={`${election.options.find((option) => option.id === selected)?.label ?? "Candidate"} candidate`}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      )}
                      <p className="font-bold text-[#10243f]">{election.options.find((option) => option.id === selected)?.label}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void submitBallot()}
                    className="mt-6 h-12 w-full rounded-lg bg-[#1aa79a] text-sm font-bold text-white disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit my ballot"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("ballot")}
                    className="mt-3 h-11 w-full rounded-lg text-sm font-bold text-[#617083]"
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
