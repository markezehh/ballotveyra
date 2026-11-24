import { Suspense } from "react";
import { VoterExperience } from "./voter-experience";

export default function VotePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#8793a1]">Checking voting link…</p>}>
      <VoterExperience />
    </Suspense>
  );
}
