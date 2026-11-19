import { Brand } from "@/components/brand";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfa]">
      <header className="border-b border-[#10243f]/8 bg-white">
        <div className="mx-auto flex h-20 max-w-[1000px] items-center px-5 sm:px-8">
          <Brand />
        </div>
      </header>
      <article className="mx-auto max-w-[760px] px-5 py-14 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#13877d]">
          Terms
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#10243f]">
          Terms of use
        </h1>
        <div className="mt-7 space-y-8 text-[#657487]">
          <section>
            <h2 className="text-xl font-bold text-[#10243f]">
              Organizer responsibilities
            </h2>
            <p className="mt-3 leading-7">
              Organizers are responsible for eligibility rules, lawful processing of
              voter information, private distribution of invitation links, and
              accurate election schedules.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#10243f]">Bearer invitations</h2>
            <p className="mt-3 leading-7">
              An invitation link grants the ability to submit one ballot. It should
              be distributed only to the intended voter and kept confidential.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#10243f]">Availability</h2>
            <p className="mt-3 leading-7">
              Election operators should test their deployment and maintain
              appropriate support and backup procedures for material organizational
              elections.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
