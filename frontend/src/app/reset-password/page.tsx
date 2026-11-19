import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export default function ResetPasswordPage() {
  return <AuthShell title="Set a new password" subtitle="Choose a strong password you haven’t used before.">
    <form className="space-y-4"><div><label htmlFor="password" className="mb-2 block text-sm font-bold text-[#10243f]">New password</label><input id="password" type="password" autoComplete="new-password" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div><div><label htmlFor="confirm" className="mb-2 block text-sm font-bold text-[#10243f]">Confirm password</label><input id="confirm" type="password" autoComplete="new-password" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div><button type="submit" className="h-12 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white">Update password</button></form>
    <Link href="/login" className="mt-6 block text-center text-sm font-bold text-[#13877d]">Return to sign in</Link>
  </AuthShell>;
}
