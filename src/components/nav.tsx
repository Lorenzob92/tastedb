import Link from "next/link";

export function Nav() {
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
      <ul className="flex gap-6 ml-auto">
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
          <Link href="/stats" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Stats
          </Link>
        </li>
      </ul>
    </nav>
  );
}
