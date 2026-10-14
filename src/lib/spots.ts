import type { PaidStatus, SpotStatus } from "@/lib/types";

/**
 * Payment rules when a spot is saved:
 * - Unsold spots carry no payment unless refunded money is being recorded.
 * - "Refunded" is kept as entered.
 * - Choosing "Paid" with no amount fills in the full sold price.
 * - Otherwise the status follows the amount: 0 → unpaid, < price → partial, ≥ price → paid.
 */
export function derivePayment({
  status,
  soldPriceCents,
  paidCents,
  paidStatus,
}: {
  status: SpotStatus;
  soldPriceCents: number | null;
  paidCents: number;
  paidStatus: PaidStatus;
}): { paidStatus: PaidStatus; paidCents: number } {
  if (paidStatus === "refunded") return { paidStatus, paidCents };
  if (status !== "sold") {
    return paidCents > 0
      ? { paidStatus: "partial", paidCents } // deposit on a held spot
      : { paidStatus: "unpaid", paidCents: 0 };
  }

  const price = soldPriceCents ?? 0;
  if (paidStatus === "paid" && paidCents === 0) {
    return { paidStatus: "paid", paidCents: price };
  }
  if (paidCents <= 0) return { paidStatus: "unpaid", paidCents: 0 };
  if (paidCents >= price) return { paidStatus: "paid", paidCents };
  return { paidStatus: "partial", paidCents };
}
