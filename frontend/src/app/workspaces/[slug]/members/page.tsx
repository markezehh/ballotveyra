import { DashboardShell } from "@/components/dashboard-shell";

export const instant = false;

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DashboardShell title="Workspace members">
    <div className="flex items-end justify-between"><div><p className="text-sm text-[#8793a1]">/{slug}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[#10243f]">Members</h1></div><button type="button" className="h-11 rounded-lg bg-[#10243f] px-5 text-sm font-bold text-white">Add member</button></div>
    <div className="mt-8 overflow-hidden rounded-xl border border-[#10243f]/8 bg-white"><table className="w-full text-left"><thead className="border-b border-[#10243f]/8 text-xs uppercase tracking-[0.08em] text-[#8793a1]"><tr><th className="px-5 py-4">Member</th><th className="px-5 py-4">Role</th><th className="px-5 py-4" /></tr></thead><tbody>{[["Amara Okafor","amara@northbridge.org","Owner","AO"],["Tobi Adeyemi","tobi@northbridge.org","Manager","TA"],["Leila Hart","leila@northbridge.org","Observer","LH"]].map(([name,email,role,initials]) => <tr key={email} className="border-b border-[#10243f]/6 last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf4f3] text-xs font-bold text-[#13877d]">{initials}</div><div><p className="font-bold text-[#10243f]">{name}</p><p className="text-xs text-[#8793a1]">{email}</p></div></div></td><td className="px-5 py-4"><select defaultValue={role} aria-label={`Role for ${name}`} className="rounded-lg border border-[#10243f]/10 bg-white px-3 py-2 text-sm font-semibold text-[#617083]"><option>Owner</option><option>Manager</option><option>Observer</option></select></td><td className="px-5 py-4 text-right"><button type="button" className="text-sm font-bold text-[#9b4d4d]">Remove</button></td></tr>)}</tbody></table></div>
  </DashboardShell>;
}
