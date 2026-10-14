import type { Campaign, CampaignSpot } from "@/lib/types";

export type Financials = {
  revenueCents: number;
  collectedCents: number;
  costCents: number;
  profitCents: number;
  /** null when there is no cost entered yet */
  breakevenPct: number | null;
  sold: number;
  held: number;
  open: number;
  house: number;
  total: number;
};

type CostFields = Pick<
  Campaign,
  "postage_cost_cents" | "print_cost_cents" | "other_cost_cents"
>;
type SpotFields = Pick<CampaignSpot, "status" | "sold_price_cents" | "paid_cents">;

/**
 * Same math as the `campaign_financials` view, used for the campaign page
 * so the numbers update with the spot list it already has loaded.
 * Revenue counts sold spots only; collected counts every payment received.
 */
export function computeFinancials(
  campaign: CostFields,
  spots: SpotFields[],
): Financials {
  const costCents =
    (campaign.postage_cost_cents ?? 0) +
    (campaign.print_cost_cents ?? 0) +
    (campaign.other_cost_cents ?? 0);

  let revenueCents = 0;
  let collectedCents = 0;
  const counts = { sold: 0, held: 0, open: 0, house: 0 };
  for (const s of spots) {
    counts[s.status] += 1;
    if (s.status === "sold") revenueCents += s.sold_price_cents ?? 0;
    collectedCents += s.paid_cents ?? 0;
  }

  return {
    revenueCents,
    collectedCents,
    costCents,
    profitCents: revenueCents - costCents,
    breakevenPct:
      costCents === 0 ? null : Math.round((revenueCents / costCents) * 1000) / 10,
    ...counts,
    total: spots.length,
  };
}

/** Whole days from today (local date) until `date` (YYYY-MM-DD). */
export function daysUntil(date: string | null, today = new Date()): number | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - now) / 86_400_000);
}

export type GoNoGo = "go" | "at_risk" | "no_go" | "unset";

/**
 * Sold vs. min_spots_to_go. "at_risk" when short and the deadline is within
 * 7 days; "no_go" once the deadline has passed and it's still short.
 */
export function goNoGo(
  sold: number,
  minSpots: number | null,
  salesDeadline: string | null,
  today = new Date(),
): GoNoGo {
  if (!minSpots) return "unset";
  if (sold >= minSpots) return "go";
  const days = daysUntil(salesDeadline, today);
  if (days != null && days < 0) return "no_go";
  if (days != null && days <= 7) return "at_risk";
  return "unset";
}
