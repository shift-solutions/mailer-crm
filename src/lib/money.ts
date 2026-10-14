const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Format integer cents as dollars. Whole-dollar amounts drop the ".00". */
export function formatCents(cents: number | null | undefined): string {
  const c = cents ?? 0;
  return c % 100 === 0 ? usd.format(c / 100) : usdCents.format(c / 100);
}

/** Parse a dollar string from a form ("1,250", "$700.50") to integer cents. */
export function dollarsToCents(input: string | null | undefined): number | null {
  if (input == null) return null;
  const cleaned = String(input).replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function centsToDollarInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}
