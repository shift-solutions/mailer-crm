import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Campaign } from "@/lib/types";

export type CampaignFinancialsRow = {
  campaign_id: string;
  revenue_cents: number;
  collected_cents: number;
  cost_cents: number;
  profit_cents: number;
  breakeven_pct: number | null;
  spots_total: number;
  spots_sold: number;
  spots_held: number;
  spots_open: number;
  spots_house: number;
};

export type CampaignWithFinancials = Campaign & {
  format_name: string;
  fin: CampaignFinancialsRow;
};

const emptyFin = (id: string): CampaignFinancialsRow => ({
  campaign_id: id,
  revenue_cents: 0,
  collected_cents: 0,
  cost_cents: 0,
  profit_cents: 0,
  breakeven_pct: null,
  spots_total: 0,
  spots_sold: 0,
  spots_held: 0,
  spots_open: 0,
  spots_house: 0,
});

/** Campaigns joined with the campaign_financials view. */
export async function listCampaigns(
  supabase: SupabaseClient,
  { activeOnly = false }: { activeOnly?: boolean } = {},
): Promise<CampaignWithFinancials[]> {
  let q = supabase
    .from("campaigns")
    .select("*, card_formats(name)")
    .order("drop_date", { ascending: true, nullsFirst: false });
  if (activeOnly) q = q.in("status", ["planning", "selling", "production"]);

  const [{ data: campaigns, error }, { data: fins, error: finError }] = await Promise.all([
    q,
    supabase.from("campaign_financials").select("*"),
  ]);
  if (error) throw error;
  if (finError) throw finError;

  const byId = new Map(
    (fins as CampaignFinancialsRow[]).map((f) => [f.campaign_id, normalizeFin(f)]),
  );
  return (campaigns ?? []).map((c) => {
    const { card_formats, ...rest } = c as Campaign & { card_formats: { name: string } | null };
    return {
      ...rest,
      format_name: card_formats?.name ?? "",
      fin: byId.get(c.id) ?? emptyFin(c.id),
    };
  });
}

// PostgREST returns bigint columns as numbers but numeric as numbers or strings
// depending on settings; coerce so math is safe.
function normalizeFin(f: CampaignFinancialsRow): CampaignFinancialsRow {
  const n = (v: unknown) => (v == null ? 0 : Number(v));
  return {
    ...f,
    revenue_cents: n(f.revenue_cents),
    collected_cents: n(f.collected_cents),
    cost_cents: n(f.cost_cents),
    profit_cents: n(f.profit_cents),
    breakeven_pct: f.breakeven_pct == null ? null : Number(f.breakeven_pct),
  };
}
