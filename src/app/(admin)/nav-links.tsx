"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const links = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="3" y="3" width="6" height="6" rx="1.4" />
        <rect x="11" y="3" width="6" height="6" rx="1.4" />
        <rect x="3" y="11" width="6" height="6" rx="1.4" />
        <rect x="11" y="11" width="6" height="6" rx="1.4" />
      </svg>
    ),
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M3.5 5.5h13v9a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3.5 14.5v-9Z" />
        <path d="M3.5 8.5h13M7.5 5.5V4.2A1.2 1.2 0 0 1 8.7 3h2.6a1.2 1.2 0 0 1 1.2 1.2v1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/contacts",
    label: "Businesses",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 16.5v-1.2A3.3 3.3 0 0 1 7.3 12h5.4a3.3 3.3 0 0 1 3.3 3.3v1.2" strokeLinecap="round" />
        <circle cx="10" cy="7" r="2.6" />
      </svg>
    ),
  },
  {
    href: "/formats",
    label: "Card formats",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="3" y="4" width="14" height="12" rx="1.5" />
        <path d="M3 8.5h14M8 8.5V16" />
      </svg>
    ),
  },
] as const;

export function NavLinks() {
  return <NavList pathname={usePathname()} />;
}

/** Same links with nothing highlighted; the prerendered fallback. */
export function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:px-3 md:pb-4">
      {links.map((l) => {
        const active =
          pathname != null &&
          (l.href === "/" ? pathname === "/" : pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            )}
          >
            {l.icon}
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
