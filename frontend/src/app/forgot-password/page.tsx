import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  return <AuthShell title="Reset your password" subtitle="Enter your account email and we’ll send you a secure reset link.">
    <form className="space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-bold text-[#10243f]">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@organization.org" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div><button type="submit" className="h-12 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white">Send reset link</button></form>
    <Link href="/login" className="mt-6 block text-center text-sm font-bold text-[#13877d]">← Back to sign in</Link>
  </AuthShell>;
}
