import { signOut } from "@/app/login/actions";
import { Suspense } from "react";
import { ThemeSwitcher } from "@/components/theme";
import { NavLinks, NavList } from "./nav-links";

// Static chrome only. Each page checks the admin session inside its own
// Suspense boundary (see src/lib/auth.ts), so this shell can prerender.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-stone-200 bg-white md:w-52 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">Mailer CRM</p>
            <p className="text-xs text-stone-500">Shift Solutions</p>
          </div>
          <ThemeSwitcher className="md:hidden" />
        </div>
        <Suspense fallback={<NavList pathname={null} />}>
          <NavLinks />
        </Suspense>
        <div className="hidden px-4 pb-3 md:block">
          <ThemeSwitcher />
        </div>
        <form action={signOut} className="hidden px-2 pb-4 md:block">
          <button className="w-full rounded-md px-2 py-1.5 text-left text-sm text-stone-500 hover:bg-stone-100">
            Sign out
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
