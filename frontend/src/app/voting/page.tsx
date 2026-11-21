"use client";

import { useState } from "react";
import { Brand } from "@/components/brand";

const choices = [
    ["amara", "Ezeh Mark", "Youth President and community organizer"],
    ["daniel", "Ugwu John", "Chief of Staff and student advocate"],
    ["sofia", "Onyia Samson", "Alumni liaison and peer mentor"],
];

export function VoterExperience() {
    const [selected, setSelected] = useState("");
    const [step, setStep] = useState<"ballot" | "review" | "done">("ballot");

    if (step === "done") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f9f8] px-5">
                <section className="w-full max-w-[480px] rounded-2xl border border-[#10243f]/8 bg-white p-7 text-center ballot-shadow">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf8f6] text-[#13877d]">
                        <svg
                            viewBox="0 0 24 24"
                            className="h-7 w-7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="m5 12 4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="mt-5 text-2xl font-bold text-[#10243f]">
                        Your ballot was submitted
                    </h1>
                    <p className="mt-3 leading-7 text-[#6d7b8b]">
                        Thank you for participating. This invitation has now been used.
                    </p>
                    <p className="mt-6 text-xs text-[#8793a1]">
                        Do not refresh or reuse this page as a voting receipt.
                    </p>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f7f9f8] px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-[520px]">
                <Brand />
                <section className="mt-6 rounded-2xl border border-[#10243f]/8 bg-white p-5 sm:p-7 ballot-shadow">
                    <div className="border-b border-[#10243f]/8 pb-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#13877d]">
                            Private election
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-[#10243f]">
                            Student Council President
                        </h1>
                        <p className="mt-2 text-sm text-[#8793a1]">
                            Northbridge Alumni · Africa/Lagos (WAT)
                        </p>
                    </div>

                    {step === "ballot" ? (
                        <>
                            <fieldset className="mt-5">
                                <legend className="text-base font-bold text-[#10243f]">
                                    Who should be your student council president?
                                </legend>
                                <p className="mt-1 text-sm text-[#8793a1]">
                                    Select one choice.
                                </p>
                                <div className="mt-5 space-y-3">
                                    {choices.map(([id, name, description]) => (
                                        <label
                                            key={id}
                                            className={`flex min-h-[76px] cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                                                selected === id
                                                    ? "border-[#1aa79a] bg-[#f4fbf9]"
                                                    : "border-[#10243f]/12 hover:border-[#10243f]/30"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="choice"
                                                value={id}
                                                checked={selected === id}
                                                onChange={() => setSelected(id)}
                                                className="mt-1 h-5 w-5 accent-[#1aa79a]"
                                            />
                                            <span>
                                                <span className="block font-bold text-[#10243f]">
                                                    {name}
                                                </span>
                                                <span className="mt-1 block text-sm leading-5 text-[#7a8794]">
                                                    {description}
                                                </span>
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
                            <h2 className="mt-5 text-xl font-bold text-[#10243f]">
                                Review your choice
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[#8793a1]">
                                Confirm your choice before submitting. You cannot edit or
                                replace this ballot afterward.
                            </p>
                            <div className="mt-5 rounded-xl border border-[#1aa79a]/30 bg-[#f4fbf9] p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#13877d]">
                                    Your choice
                                </p>
                                <p className="mt-2 font-bold text-[#10243f]">
                                    {
                                        choices.find((choice) => choice[0] === selected)
                                            ?.[1]
                                    }
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStep("done")}
                                className="mt-6 h-12 w-full rounded-lg bg-[#1aa79a] text-sm font-bold text-white"
                            >
                                Submit my ballot
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
                </section>
                <p className="mt-5 text-center text-xs leading-5 text-[#8793a1]">
                    This link is a bearer credential. Keep it private and do not forward
                    it.
                </p>
            </div>
        </main>
    );
}

export default VoterExperience;
