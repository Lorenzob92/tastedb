"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AuthCollageBg } from "@/components/auth-collage-bg";

export default function SignupPage() {
  const { signUp, isConfigured } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: authError } = await signUp(email, password, {
      username: username || undefined,
      display_name: username || undefined,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (!isConfigured) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a12] px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-black text-white mb-4">
            taste<span className="text-[#638dff]">db</span>
          </h1>
          <p className="text-zinc-400 mb-6">
            Supabase is not configured yet. The app is running in guest mode
            with localStorage.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-[#638dff] text-white rounded-lg font-semibold hover:bg-[#4f7aff] transition-colors"
          >
            Continue as Guest
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a12] px-4">
        <AuthCollageBg />
        <div className="relative z-10 w-full max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl p-8 shadow-2xl text-center">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              taste<span className="text-[#638dff]">db</span>
            </h1>
            <div className="text-4xl mb-4">&#10003;</div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Check your email
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              We sent a confirmation link to{" "}
              <span className="text-white">{email}</span>. Click it to activate
              your account.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-[#638dff] text-white rounded-lg font-semibold hover:bg-[#4f7aff] transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a12] px-4 overflow-y-auto">
      <AuthCollageBg />

      <div className="relative z-10 w-full max-w-sm my-8">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              taste<span className="text-[#638dff]">db</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Create your collection
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs text-zinc-500 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#638dff]/50 focus:ring-1 focus:ring-[#638dff]/25 transition-colors"
                placeholder="Pick a username"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-xs text-zinc-500 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#638dff]/50 focus:ring-1 focus:ring-[#638dff]/25 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs text-zinc-500 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#638dff]/50 focus:ring-1 focus:ring-[#638dff]/25 transition-colors"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs text-zinc-500 mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#638dff]/50 focus:ring-1 focus:ring-[#638dff]/25 transition-colors"
                placeholder="Type it again"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-lg bg-[#638dff] text-white text-sm font-semibold hover:bg-[#4f7aff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-600 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#638dff] hover:text-[#4f7aff] transition-colors"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
