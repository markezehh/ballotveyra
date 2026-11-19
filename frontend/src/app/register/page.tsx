import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  return <AuthShell title="Create your account" subtitle="Start a private election for your organization.">
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-3"><div><label htmlFor="first" className="mb-2 block text-sm font-bold text-[#10243f]">First name</label><input id="first" autoComplete="given-name" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div><div><label htmlFor="last" className="mb-2 block text-sm font-bold text-[#10243f]">Last name</label><input id="last" autoComplete="family-name" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div></div>
      <div><label htmlFor="email" className="mb-2 block text-sm font-bold text-[#10243f]">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@organization.org" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-bold text-[#10243f]">Password</label><input id="password" type="password" autoComplete="new-password" placeholder="At least 12 characters" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div>
      <button type="submit" className="h-12 w-full rounded-lg bg-[#1aa79a] text-sm font-bold text-white hover:bg-[#13877d]">Create account</button>
      <p className="text-xs leading-5 text-[#7a8794]">By creating an account, you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
    </form>
    <p className="mt-5 text-center text-sm text-[#6d7b8b]">Already have an account? <Link href="/login" className="font-bold text-[#13877d]">Sign in</Link></p>
  </AuthShell>;
}
