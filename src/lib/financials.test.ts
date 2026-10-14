import { describe, expect, it } from "vitest";
import { computeFinancials, daysUntil, goNoGo } from "./financials";
import { dollarsToCents, formatCents } from "./money";
import { derivePayment } from "./spots";
import { toCsv } from "./csv";

const costs = { postage_cost_cents: 250_000, print_cost_cents: 150_000, other_cost_cents: 10_000 };

describe("computeFinancials (acceptance test 5: hand calculation)", () => {
  // Westridge 9x12: $4,100 cost. Sold F1 ($1,250), F2 at a $100 discount ($600), B1 ($600).
  const spots = [
    { status: "sold" as const, sold_price_cents: 125_000, paid_cents: 125_000 },
    { status: "sold" as const, sold_price_cents: 60_000, paid_cents: 30_000 },
    { status: "sold" as const, sold_price_cents: 60_000, paid_cents: 0 },
    { status: "held" as const, sold_price_cents: null, paid_cents: 10_000 },
    ...Array.from({ length: 11 }, () => ({ status: "open" as const, sold_price_cents: null, paid_cents: 0 })),
  ];
  const f = computeFinancials(costs, spots);

  it("sums revenue from sold spots only", () => expect(f.revenueCents).toBe(245_000));
  it("sums every payment received", () => expect(f.collectedCents).toBe(165_000));
  it("adds the three cost fields", () => expect(f.costCents).toBe(410_000));
  it("profit = revenue − cost", () => expect(f.profitCents).toBe(-165_000));
  it("breakeven % to one decimal", () => expect(f.breakevenPct).toBe(59.8)); // 2450/4100
  it("counts spots by status", () => {
    expect([f.sold, f.held, f.open, f.house, f.total]).toEqual([3, 1, 11, 0, 15]);
  });
  it("has no breakeven when there are no costs", () => {
    expect(computeFinancials({ postage_cost_cents: 0, print_cost_cents: 0, other_cost_cents: 0 }, spots).breakevenPct).toBeNull();
  });
  it("hits 100% exactly at breakeven", () => {
    const even = computeFinancials(costs, [{ status: "sold", sold_price_cents: 410_000, paid_cents: 0 }]);
    expect(even.breakevenPct).toBe(100);
    expect(even.profitCents).toBe(0);
  });
});

describe("goNoGo", () => {
  const today = new Date(2026, 9, 14); // Oct 14, 2026
  it("is go once the threshold is met", () => expect(goNoGo(8, 8, "2026-10-15", today)).toBe("go"));
  it("is at risk inside 7 days", () => expect(goNoGo(5, 8, "2026-10-20", today)).toBe("at_risk"));
  it("is no-go after the deadline", () => expect(goNoGo(5, 8, "2026-10-13", today)).toBe("no_go"));
  it("is unset with no threshold", () => expect(goNoGo(5, null, "2026-10-13", today)).toBe("unset"));
  it("counts days by calendar date", () => {
    expect(daysUntil("2026-10-14", today)).toBe(0);
    expect(daysUntil("2026-11-01", today)).toBe(18);
  });
});

describe("money", () => {
  it("parses dollar inputs to cents", () => {
    expect(dollarsToCents("1,250")).toBe(125_000);
    expect(dollarsToCents("$700.50")).toBe(70_050);
    expect(dollarsToCents("")).toBeNull();
    expect(dollarsToCents("abc")).toBeNull();
  });
  it("formats cents", () => {
    expect(formatCents(125_000)).toBe("$1,250");
    expect(formatCents(70_050)).toBe("$700.50");
    expect(formatCents(-165_000)).toBe("-$1,650");
  });
});

describe("derivePayment", () => {
  it("fills the full price when marked paid with no amount", () => {
    expect(derivePayment({ status: "sold", soldPriceCents: 70_000, paidCents: 0, paidStatus: "paid" }))
      .toEqual({ paidStatus: "paid", paidCents: 70_000 });
  });
  it("derives partial from the amount", () => {
    expect(derivePayment({ status: "sold", soldPriceCents: 70_000, paidCents: 35_000, paidStatus: "unpaid" }))
      .toEqual({ paidStatus: "partial", paidCents: 35_000 });
  });
  it("keeps refunded as entered", () => {
    expect(derivePayment({ status: "open", soldPriceCents: null, paidCents: 0, paidStatus: "refunded" }).paidStatus)
      .toBe("refunded");
  });
  it("clears payment on an open spot", () => {
    expect(derivePayment({ status: "open", soldPriceCents: null, paidCents: 0, paidStatus: "paid" }))
      .toEqual({ paidStatus: "unpaid", paidCents: 0 });
  });
  it("records a deposit on a held spot as partial", () => {
    expect(derivePayment({ status: "held", soldPriceCents: null, paidCents: 10_000, paidStatus: "unpaid" }))
      .toEqual({ paidStatus: "partial", paidCents: 10_000 });
  });
});

describe("toCsv", () => {
  it("quotes commas and neutralizes formulas", () => {
    expect(toCsv(["a", "b"], [["Smith, Co", "=HYPERLINK()"]])).toBe('a,b\r\n"Smith, Co",\'=HYPERLINK()\r\n');
  });
});
