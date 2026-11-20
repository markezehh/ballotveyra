"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { apiRequest } from "@/lib/api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirm") ?? "");
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (!token) {
      setMessage("This reset link is missing a valid token.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      setMessage("Password updated successfully. You can now sign in.");
      event.currentTarget.reset();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you haven’t used before.">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold text-[#10243f]">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-2 block text-sm font-bold text-[#10243f]">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            className="h-12 w-full rounded-lg border border-[#10243f]/15 px-4 text-sm outline-none focus:border-[#1aa79a]"
          />
        </div>
        {message && (
          <p role="status" className="rounded-lg bg-[#edf4f3] px-3 py-2 text-sm text-[#4e6478]">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !token}
          className="h-12 w-full rounded-lg bg-[#10243f] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <Link href="/login" className="mt-6 block text-center text-sm font-bold text-[#13877d]">
        Return to sign in
      </Link>
    </AuthShell>
  );
}
