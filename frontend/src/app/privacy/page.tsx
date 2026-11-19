import { Brand } from "@/components/brand";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfa]">
      <header className="border-b border-[#10243f]/8 bg-white">
        <div className="mx-auto flex h-20 max-w-[1000px] items-center px-5 sm:px-8">
          <Brand />
        </div>
      </header>
      <article className="mx-auto max-w-[760px] px-5 py-14 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#13877d]">
          Privacy
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#10243f]">
          Privacy policy
        </h1>
        <p className="mt-5 leading-8 text-[#657487]">
          BallotVeyra is designed to separate voter eligibility from individual
          ballot choices at the application level. Eligible voter records are
          used to authorize an invitation; submitted ballots are stored without a
          voter identifier or invitation credential.
        </p>
        <h2 className="mt-10 text-xl font-bold text-[#10243f]">
          What organizers can see
        </h2>
        <p className="mt-3 leading-7 text-[#657487]">
          Organizers can see voter import records, turnout, and aggregate
          published totals. They cannot see which option an individual voter
          selected, and private election results are not included in public
          directories.
        </p>
        <h2 className="mt-10 text-xl font-bold text-[#10243f]">
          Infrastructure and limitations
        </h2>
        <p className="mt-3 leading-7 text-[#657487]">
          Infrastructure administrators may have privileged database visibility,
          and very small elections may allow people to infer choices from
          aggregate totals. This is not an independently verifiable voting
          protocol.
        </p>
      </article>
    </main>
  );
}
