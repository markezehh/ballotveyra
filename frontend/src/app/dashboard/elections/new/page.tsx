"use client";

import { FormEvent, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";

export default function NewElectionPage() {
  const [choices, setChoices] = useState(["Amara Okafor", "Daniel Mensah"]);
  const [status, setStatus] = useState("");

  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const finalStep = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("name") === "continue";
    const opens = String(form.get("opens") ?? "");
    const closes = String(form.get("closes") ?? "");
    if (opens && closes && new Date(closes) <= new Date(opens)) {
      setStatus("Closing time must be after opening time.");
      return;
    }
    if (choices.some((choice) => !choice.trim()) || choices.length < 2) {
      setStatus("Add at least two non-empty ballot choices.");
      return;
    }
    setStatus(finalStep ? "Draft ready. Voter setup will open when the API is connected." : "Draft saved locally for this preview.");
  }

  return (
    <DashboardShell title="Create election">
      <div className="mx-auto max-w-[760px]">
        <p className="text-sm font-semibold text-[#8793a1]">New election</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#10243f]">Set up the election</h1>
        <div className="mt-8 rounded-xl border border-[#10243f]/8 bg-white p-6 sm:p-8">
          <form className="space-y-6" onSubmit={(event) => submitDraft(event)}>
            <div><label htmlFor="title" className="mb-2 block text-sm font-bold text-[#10243f]">Election title</label><input id="title" name="title" required placeholder="e.g. Student Council President" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /><p className="mt-2 text-xs text-[#8793a1]">Use a clear name voters will recognize.</p></div>
            <div><label htmlFor="description" className="mb-2 block text-sm font-bold text-[#10243f]">Description</label><textarea id="description" name="description" rows={4} placeholder="Describe the purpose and context of this election." className="w-full resize-y rounded-lg border border-[#10243f]/15 p-4 text-sm outline-none focus:border-[#1aa79a]" /></div>
            <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="opens" className="mb-2 block text-sm font-bold text-[#10243f]">Opening time</label><input id="opens" name="opens" type="datetime-local" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-3 text-sm outline-none focus:border-[#1aa79a]" /></div><div><label htmlFor="closes" className="mb-2 block text-sm font-bold text-[#10243f]">Closing time</label><input id="closes" name="closes" type="datetime-local" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-3 text-sm outline-none focus:border-[#1aa79a]" /></div></div>
            <div><label htmlFor="timezone" className="mb-2 block text-sm font-bold text-[#10243f]">Election timezone</label><select id="timezone" name="timezone" defaultValue="Africa/Lagos" className="h-12 w-full rounded-lg border border-[#10243f]/15 bg-white px-4 text-sm outline-none focus:border-[#1aa79a]"><option>Africa/Lagos</option><option>UTC</option><option>America/New_York</option><option>Europe/London</option></select></div>
            <fieldset className="border-t border-[#10243f]/8 pt-6"><legend className="font-bold text-[#10243f]">Ballot choices</legend><p className="mt-1 text-sm text-[#8793a1]">Add 2–50 ordered choices for this election.</p><div className="mt-4 space-y-3">{choices.map((choice, index) => <div key={index} className="flex gap-2"><input aria-label={`Choice ${index + 1}`} value={choice} onChange={(event) => setChoices((current) => current.map((value, i) => i === index ? event.target.value : value))} className="h-12 min-w-0 flex-1 rounded-lg border border-[#10243f]/15 px-4 text-sm" />{choices.length > 2 && <button type="button" aria-label={`Remove choice ${index + 1}`} onClick={() => setChoices((current) => current.filter((_, i) => i !== index))} className="h-12 rounded-lg border border-[#10243f]/15 px-3 text-sm font-bold text-[#9b4d4d]">Remove</button>}</div>)}<button type="button" disabled={choices.length >= 50} onClick={() => setChoices((current) => [...current, ""])} className="h-11 rounded-lg border border-dashed border-[#10243f]/20 px-4 text-sm font-bold text-[#13877d] disabled:opacity-40">+ Add choice</button></div></fieldset>
            {status && <p role="status" className="rounded-lg bg-[#edf4f3] px-4 py-3 text-sm font-bold text-[#4e6478]">{status}</p>}
            <div className="flex justify-end gap-3 border-t border-[#10243f]/8 pt-6"><button type="submit" name="save" className="h-11 rounded-lg px-4 text-sm font-bold text-[#617083]">Save draft</button><button type="submit" name="continue" className="h-11 rounded-lg bg-[#1aa79a] px-5 text-sm font-bold text-white">Continue to voters</button></div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
