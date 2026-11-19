import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  return <AuthShell title="Welcome back" subtitle="Sign in to manage your elections and workspaces.">
    <form className="space-y-5">
      <div><label htmlFor="email" className="mb-2 block text-sm font-bold text-[#10243f]">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@organization.org" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div>
      <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-bold text-[#10243f]">Password</label><Link href="/forgot-password" className="text-xs font-bold text-[#13877d]">Forgot password?</Link></div><input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div>
      <button type="submit" className="h-12 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white transition-colors hover:bg-[#173454]">Sign in</button>
    </form>
    <p className="mt-6 text-center text-sm text-[#6d7b8b]">New to BallotVeyra? <Link href="/register" className="font-bold text-[#13877d]">Create an account</Link></p>
  </AuthShell>;
}
