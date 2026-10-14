import type { CampaignStatus } from "@/lib/types";
import { daysUntil, type GoNoGo } from "@/lib/financials";
import { Badge } from "@/components/ui";

const statusTone: Record<CampaignStatus, "neutral" | "green" | "amber" | "red" | "blue"> = {
  planning: "neutral",
  selling: "blue",
  production: "amber",
  mailed: "green",
  closed: "neutral",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge tone={statusTone[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DaysLabel({ date }: { date: string | null }) {
  const days = daysUntil(date);
  if (days == null) return <span className="text-stone-400">No date</span>;
  if (days < 0) return <span className="text-stone-500">{-days}d ago</span>;
  if (days === 0) return <span className="font-medium text-red-600">Today</span>;
  return (
    <span className={days <= 7 ? "font-medium text-amber-700" : "text-stone-700"}>
      {days}d left
    </span>
  );
}

export function GoNoGoBadge({
  state,
  sold,
  min,
}: {
  state: GoNoGo;
  sold: number;
  min: number | null;
}) {
  if (state === "unset" && !min) return <Badge>No threshold set</Badge>;
  const label = `${sold} of ${min} needed`;
  if (state === "go") return <Badge tone="green">Go · {label}</Badge>;
  if (state === "no_go") return <Badge tone="red">Short · {label}</Badge>;
  if (state === "at_risk") return <Badge tone="amber">At risk · {label}</Badge>;
  return <Badge tone="blue">Selling · {label}</Badge>;
}
