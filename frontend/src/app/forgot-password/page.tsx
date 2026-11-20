"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { apiRequest } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<{ ok: boolean; resetUrl?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      });
      setMessage(result.resetUrl ? `Development reset link: ${result.resetUrl}` : "If an account exists, password reset instructions have been sent.");
      event.currentTarget.reset();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to request password reset");
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Reset your password" subtitle="Enter your account email and we’ll send you a secure reset link.">
    <form className="space-y-5" onSubmit={submit}><div><label htmlFor="email" className="mb-2 block text-sm font-bold text-[#10243f]">Email address</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@organization.org" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div>{message && <p role="status" className="break-all rounded-lg bg-[#edf4f3] px-3 py-2 text-sm text-[#4e6478]">{message}</p>}<button type="submit" disabled={loading} className="h-12 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white disabled:opacity-60">{loading ? "Sending…" : "Send reset link"}</button></form>
    <Link href="/login" className="mt-6 block text-center text-sm font-bold text-[#13877d]">← Back to sign in</Link>
  </AuthShell>;
}
