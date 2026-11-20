import Link from "next/link";
import { BrandMark } from "./brand";
import { apiRequest } from "@/lib/api";

const nav = [
  ["Overview", "/dashboard", "grid"],
  ["Elections", "/dashboard", "ballot"],
  ["Members", "/workspaces/northbridge/members", "users"],
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    ballot: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 8 2 2 4-4M8 16h8"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function DashboardShell({ children, title, account, workspace }: { children: React.ReactNode; title?: string; account?: any; workspace?: any }) {
  const name = account ? `${account.firstName ?? ""} ${account.lastName ?? ""}`.trim() : "";
  const initials = name.split(" ").filter(Boolean).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase() || "BV";
  const workspaceName = workspace?.name ?? "My Workspace";
  const workspaceSlug = workspace?.slug ?? "northbridge";

  async function logout() {
    await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#f5f7f6]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r border-[#10243f]/8 bg-white px-4 py-6 lg:block">
        <div className="px-2"><Link href="/" className="flex items-center gap-3"><BrandMark size="sm" /><span className="text-lg font-bold text-[#10243f]">BallotVeyra</span></Link></div>
        <nav className="mt-8 space-y-1" aria-label="Dashboard navigation">
          {nav.map(([label, href, icon]) => (
            <Link key={label} href={label === "Members" ? `/workspaces/${workspaceSlug}/members` : href} className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#617083] transition-colors hover:bg-[#edf4f3] hover:text-[#10243f]">
              <Icon name={icon} />{label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={logout} className="absolute bottom-16 left-4 right-4 h-10 rounded-lg border border-[#10243f]/10 text-sm font-bold text-[#617083]">Sign out</button>
        <div className="absolute bottom-6 left-4 right-4 rounded-xl border border-[#10243f]/8 p-3">
          <p className="text-xs font-bold text-[#10243f]">{workspaceName}</p>
          <p className="mt-1 truncate text-xs text-[#8793a1]">{workspace?.role ? `${workspace.role.toLowerCase()} workspace` : "Workspace"}</p>
        </div>
      </aside>
      <div className="lg:pl-[240px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#10243f]/8 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3"><div className="lg:hidden"><BrandMark size="sm" /></div><p className="font-bold text-[#10243f]">{title ?? "Overview"}</p></div>
          <div className="flex items-center gap-3"><Link href={`/workspaces/${workspaceSlug}/members`} className="hidden rounded-lg border border-[#10243f]/10 px-3 py-2 text-xs font-bold text-[#617083] sm:block">{workspaceName} ▾</Link><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10243f] text-xs font-bold text-white" title={name || account?.email}>{initials}</div></div>
        </header>
        <main className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
