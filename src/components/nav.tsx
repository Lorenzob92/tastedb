"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function Nav() {
  const { user, isConfigured, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <nav className="flex items-center px-6 py-4 border-b border-white/5">
      <Link href="/" className="flex items-baseline gap-1">
        <span className="text-xl font-black text-white tracking-tight">
          taste<span className="text-[#638dff]">db</span>
        </span>
        <span
          className="text-[10px] text-white/15 font-semibold ml-1"
          style={{ writingMode: "vertical-rl", letterSpacing: "2px" }}
        >
          味覚
        </span>
      </Link>
      <ul className="flex gap-6 ml-auto items-center">
        <li>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Collection
          </Link>
        </li>
        <li>
          <Link href="/wishlist" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Wishlist
          </Link>
        </li>
        <li>
          <Link href="/recommendations" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Recs
          </Link>
        </li>
        <li>
          <Link href="/search" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Search
          </Link>
        </li>
        <li>
          <Link href="/stats" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Stats
          </Link>
        </li>

        {/* Auth section */}
        {isConfigured && user ? (
          <>
            <li className="text-xs text-zinc-500 border-l border-white/10 pl-6">
              {user.user_metadata?.username || user.email?.split("@")[0] || "User"}
            </li>
            <li>
              <button
                onClick={handleSignOut}
                className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
              >
                Sign Out
              </button>
            </li>
          </>
        ) : isConfigured ? (
          <li className="border-l border-white/10 pl-6">
            <Link
              href="/login"
              className="text-sm text-[#638dff] hover:text-[#4f7aff] transition-colors"
            >
              Sign In
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
