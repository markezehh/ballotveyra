"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { apiRequest } from "@/lib/api";

type Voter = {
  id: string;
  voterKey: string;
  email: string | null;
  displayName: string | null;
  redeemed: boolean;
  tokenDigest: string | null;
};

type Election = {
  id: string;
  slug: string;
  title: string;
  status: string;
  voters: Voter[];
};

export default function ManageVotersPage() {
  const [account, setAccount] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [invitingId, setInvitingId] = useState("");
  const [invitingElectionId, setInvitingElectionId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [me, workspaces, electionData] = await Promise.all([
        apiRequest<{ account: any }>("/api/auth/me"),
        apiRequest<{ workspaces: any[] }>("/api/workspaces"),
        apiRequest<{ elections: Election[] }>("/api/elections"),
      ]);

      const detailed = await Promise.all(
        electionData.elections.map((election) =>
          apiRequest<{ election: Election }>(`/api/elections/${election.id}`)
            .then((data) => data.election)
        )
      );

      setAccount(me.account);
      setWorkspace(workspaces.workspaces[0] ?? null);
      setElections(detailed);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Unable to load voters");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function inviteVoter(election: Election, voter: Voter) {
    setInvitingId(voter.id);
    setStatus("");
    try {
      const result = await apiRequest<{ invitationUrl: string }>(
        `/api/elections/${election.id}/voters/${voter.id}/invite`,
        { method: "POST" }
      );

      await navigator.clipboard?.writeText(result.invitationUrl);
      setElections((current) => current.map((item) => item.id === election.id
        ? { ...item, voters: item.voters.map((candidate) => candidate.id === voter.id ? { ...candidate, tokenDigest: "issued" } : candidate) }
        : item
      ));

      const email = voter.email ?? voter.voterKey;
      const subject = encodeURIComponent(`Invitation: ${election.title}`);
      const body = encodeURIComponent(`You are invited to vote. Open this secure link: ${result.invitationUrl}`);
      setStatus(`Invitation ready for ${email} and copied to the clipboard.`);

      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Unable to invite voter");
    } finally {
      setInvitingId("");
    }
  }

  async function inviteAll(election: Election) {
    setInvitingElectionId(election.id);
    setStatus("");
    try {
      const result = await apiRequest<{ invited: number; invitations: Array<{ voterId: string; email: string | null; invitationUrl: string }> }>(
        `/api/elections/${election.id}/voters/invite-all`,
        { method: "POST" }
      );

      setElections((current) => current.map((item) => item.id === election.id
        ? {
            ...item,
            voters: item.voters.map((voter) =>
              result.invitations.some((invitation) => invitation.voterId === voter.id)
                ? { ...voter, tokenDigest: "issued" }
                : voter
            ),
          }
        : item
     ));
      setStatus(`${result.invited} voter invitation${result.invited === 1 ? "" : "s"} generated for ${election.title}.`);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Unable to invite voters");
    } finally {
      setInvitingElectionId("");
    }
  }

  return (
    <DashboardShell title="Manage Voters" account={account} workspace={workspace}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#10243f]">Manage voters</h1>
        <p className="mt-2 text-sm text-[#8793a1]">View eligible voters by election and generate a secure invitation.</p>
      </div>

      {status && (
        <p role="status" className="mt-5 rounded-lg bg-[#edf4f3] px-4 py-3 text-sm font-bold text-[#4e6478]">
          {status}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-[#8793a1]">Loading voters…</p>
      ) : elections.length === 0 ? (
        <div className="mt-8 rounded-xl border border-[#10243f]/8 bg-white p-8 text-center text-sm text-[#8793a1]">
          No elections found.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {elections.map((election) => (
            <section key={election.id} className="overflow-hidden rounded-xl border border-[#10243f]/8 bg-white">
              <div className="flex flex-col gap-2 border-b border-[#10243f]/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-[#10243f]">{election.title}</h2>
                  <p className="mt-1 text-xs text-[#8793a1]">/{election.slug}</p>
                  <p className="mt-1 text-xs font-bold text-[#617083]">
                    {election.voters?.length ?? 0} total voters
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-fit rounded-full bg-[#edf4f3] px-2.5 py-1 text-xs font-bold text-[#617083]">
                    {election.status}
                  </span>
                  <button
                    type="button"
                    disabled={invitingElectionId === election.id || !election.voters?.some((voter) => !voter.redeemed)}
                    onClick={() => void inviteAll(election)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#1aa79a] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {invitingElectionId === election.id ? (
                      <>
                        <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Inviting all…
                      </>
                    ) : "Invite all"}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead className="border-b border-[#10243f]/8 text-xs uppercase tracking-[0.08em] text-[#8793a1]">
                    <tr>
                      <th className="px-5 py-4 font-bold">Voter</th>
                      <th className="px-5 py-4 font-bold">Email</th>
                      <th className="px-5 py-4 font-bold">Status</th>
                      <th className="px-5 py-4 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {election.voters?.length ? election.voters.map((voter) => (
                      <tr key={voter.id} className="border-b border-[#10243f]/6 last:border-0">
                        <td className="px-5 py-4 font-bold text-[#10243f]">
                          {voter.displayName || voter.email || voter.voterKey}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#617083]">
                          {voter.email || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${voter.redeemed ? "bg-[#edf0f3] text-[#617083]" : voter.tokenDigest ? "bg-[#edf8f6] text-[#13877d]" : "bg-[#fff5df] text-[#9a7021]"}`}>
                            {voter.redeemed ? "Voted" : voter.tokenDigest ? "Invited" : "Not invited"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            disabled={invitingId === voter.id || voter.redeemed}
                            onClick={() => void inviteVoter(election, voter)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#10243f] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {invitingId === voter.id ? (
                              <>
                                <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Inviting…
                              </>
                            ) : voter.redeemed ? "Voted" : "Invite voter"}
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-[#8793a1]">
                          No eligible voters imported for this election.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
