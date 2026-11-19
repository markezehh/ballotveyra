"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { API_BASE_URL } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to create account");
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start a private election for your organization.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first" className="mb-2 block text-sm font-bold text-[#10243f]">
              First name
            </label>
            <input
              name="firstName"
              id="first"
              required
              autoComplete="given-name"
              className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]"
            />
          </div>
          <div>
            <label htmlFor="last" className="mb-2 block text-sm font-bold text-[#10243f]">
              Last name
            </label>
            <input
              name="lastName"
              id="last"
              required
              autoComplete="family-name"
              className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]"
            />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-bold text-[#10243f]">
            Email address
          </label>
          <input
            name="email"
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@organization.org"
            className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold text-[#10243f]">
            Password
          </label>
          <input
            name="password"
            id="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            placeholder="At least 12 characters"
            className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-lg bg-[#1aa79a] text-sm font-bold text-white hover:bg-[#13877d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-xs leading-5 text-[#7a8794]">
          By creating an account, you agree to the{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
      <p className="mt-5 text-center text-sm text-[#6d7b8b]">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#13877d]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
