"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AuthCollageBg } from "@/components/auth-collage-bg";

export default function LoginPage() {
  const { signIn, signInWithOAuth, isConfigured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Give the cookie a moment to propagate before navigating
      router.refresh();
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setError("");
    const { error: authError } = await signInWithOAuth(provider);
    if (authError) {
      setError(authError.message);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a12] px-4">
      <AuthCollageBg />

      <div className="relative z-10 w-full max-w-sm">
        {/* Glass card */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">
              taste<span className="text-[#638dff]">db</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Sign in to your collection
            </p>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#638dff]/50 focus:ring-1 focus:ring-[#638dff]/25 transition-colors"
                placeholder="Your password"
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-600 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#638dff] hover:text-[#4f7aff] transition-colors"
            >
              Sign up instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
