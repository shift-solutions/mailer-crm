import { cn } from "@/components/ui";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-stone-900 text-white shadow-sm">
        <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
          <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 6.5 10 11l7-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-semibold tracking-tight">Mailer</span>
        <span className="block text-[11px] text-stone-500">Shift Solutions</span>
      </span>
    </div>
  );
}
