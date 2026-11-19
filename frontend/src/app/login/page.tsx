"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { API_BASE_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to sign in");
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Welcome back" subtitle="Sign in to manage your elections and workspaces.">
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div><label htmlFor="email" className="mb-2 block text-sm font-bold text-[#10243f]">Email address</label><input name="email" id="email" type="email" required autoComplete="email" placeholder="you@organization.org" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div>
      <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-bold text-[#10243f]">Password</label><Link href="/forgot-password" className="text-xs font-bold text-[#13877d]">Forgot password?</Link></div><input name="password" id="password" type="password" required autoComplete="current-password" placeholder="Enter your password" className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]" /></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="h-12 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white transition-colors hover:bg-[#173454] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-[#6d7b8b]">New to BallotVeyra? <Link href="/register" className="font-bold text-[#13877d]">Create an account</Link></p>
  </AuthShell>;
}
