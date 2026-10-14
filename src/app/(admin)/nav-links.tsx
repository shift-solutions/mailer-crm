"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

// QR codes and stats arrive in later phases.
const links = [
  { href: "/", label: "Dashboard" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/contacts", label: "Businesses" },
  { href: "/formats", label: "Card formats" },
] as const;

export function NavLinks() {
  return <NavList pathname={usePathname()} />;
}

/** Same links with nothing highlighted; the prerendered fallback. */
export function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-4">
      {links.map((l) => {
        const active =
          pathname != null &&
          (l.href === "/" ? pathname === "/" : pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "whitespace-nowrap rounded-md px-2 py-1.5 text-sm",
              active ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
