import { signOut } from "@/app/login/actions";
import { Suspense } from "react";
import { BrandMark } from "@/components/brand";
import { ThemeSwitcher } from "@/components/theme";
import { NavLinks, NavList } from "./nav-links";

// Static chrome only. Each page checks the admin session inside its own
// Suspense boundary (see src/lib/auth.ts), so this shell can prerender.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 z-30 flex flex-col border-b border-stone-200/80 bg-white/85 backdrop-blur-xl md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0 md:bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-5 md:py-5">
          <BrandMark />
          <div className="flex items-center gap-2 md:hidden">
            <form action={signOut}>
              <button type="submit" className="px-1 text-sm font-medium text-stone-500">
                Sign out
              </button>
            </form>
            <ThemeSwitcher />
          </div>
        </div>
        <Suspense fallback={<NavList pathname={null} />}>
          <NavLinks />
        </Suspense>
        <div className="mt-auto hidden px-3 pb-4 md:block">
          <ThemeSwitcher />
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M8 4.5H5.5A1.5 1.5 0 0 0 4 6v8a1.5 1.5 0 0 0 1.5 1.5H8" strokeLinecap="round" />
                <path d="M8.5 10H16m0 0-2.2-2.2M16 10l-2.2 2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
