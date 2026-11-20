"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { apiRequest } from "@/lib/api";

export default function MembersPage() {
  const [slug, setSlug] = useState("");
  const [account, setAccount] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const routeSlug = decodeURIComponent(window.location.pathname.split("/").filter(Boolean)[1] ?? "");
    setSlug(routeSlug);
    Promise.all([
      apiRequest<{ account: any }>("/api/auth/me"),
      apiRequest<{ workspaces: any[] }>("/api/workspaces"),
    ]).then(([me, data]) => { setAccount(me.account); setWorkspace(data.workspaces.find((item) => item.slug === routeSlug) ?? data.workspaces[0] ?? null); })
      .finally(() => setLoading(false));
  }, []);

  const name = account ? `${account.firstName ?? ""} ${account.lastName ?? ""}`.trim() : "Account owner";
  const email = account?.email ?? "";
  const initials = name.split(" ").filter(Boolean).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();

  return <DashboardShell title="Workspace members" account={account} workspace={workspace}>
    <div className="flex items-end justify-between"><div><p className="text-sm text-[#8793a1]">/{slug}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[#10243f]">Members</h1></div></div>
    <div className="mt-8 overflow-hidden rounded-xl border border-[#10243f]/8 bg-white"><table className="w-full text-left"><thead className="border-b border-[#10243f]/8 text-xs uppercase tracking-[0.08em] text-[#8793a1]"><tr><th className="px-5 py-4">Member</th><th className="px-5 py-4">Role</th></tr></thead><tbody>{loading ? <tr><td colSpan={2} className="px-5 py-10 text-center text-sm text-[#8793a1]">Loading members…</td></tr> : <tr className="border-b border-[#10243f]/6 last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf4f3] text-xs font-bold text-[#13877d]">{initials}</div><div><p className="font-bold text-[#10243f]">{name}</p><p className="text-xs text-[#8793a1]">{email}</p></div></div></td><td className="px-5 py-4"><span className="rounded-lg border border-[#10243f]/10 px-3 py-2 text-sm font-semibold text-[#617083]">{workspace?.role ?? "Owner"}</span></td></tr>}</tbody></table></div>
  </DashboardShell>;
}
