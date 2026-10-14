import { formatCents } from "@/lib/money";
import { cn } from "@/components/ui";

/** Red under 100% of cost covered, green at or above. */
export function BreakevenBar({
  revenueCents,
  costCents,
  compact = false,
}: {
  revenueCents: number;
  costCents: number;
  compact?: boolean;
}) {
  const pct = costCents > 0 ? (revenueCents / costCents) * 100 : null;
  const covered = pct != null && pct >= 100;
  const width = pct == null ? 0 : Math.min(pct, 100);

  return (
    <div>
      <div
        className={cn("w-full overflow-hidden rounded-full bg-stone-200", compact ? "h-1.5" : "h-2")}
        role="progressbar"
        aria-label="Breakeven"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct == null ? undefined : Math.round(pct)}
      >
        <div
          className={cn("h-full rounded-full", covered ? "bg-green-600" : "bg-red-500")}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-stone-500 tabular">
        <span className={cn("font-medium", covered ? "text-green-700" : "text-red-600")}>
          {pct == null ? "No costs entered" : `${pct.toFixed(0)}% to breakeven`}
        </span>
        <span>
          {formatCents(revenueCents)} / {formatCents(costCents)}
        </span>
      </div>
    </div>
  );
}
