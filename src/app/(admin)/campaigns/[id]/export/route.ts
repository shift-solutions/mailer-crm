import { requireAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

type ExportSpot = {
  code: string;
  side: string;
  size_label: string;
  width_in: number;
  height_in: number;
  status: string;
  category: string | null;
  price_cents: number;
  sold_price_cents: number | null;
  paid_status: string;
  paid_cents: number;
  payment_method: string | null;
  creative_status: string;
  contacts: {
    business_name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
  } | null;
};

/** CSV of every spot and its advertiser, for production. */
export async function GET(_req: Request, ctx: RouteContext<"/campaigns/[id]/export">) {
  const { id } = await ctx.params;
  const { supabase } = await requireAdmin();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (!campaign) return new Response("Not found", { status: 404 });

  const { data: spots, error } = await supabase
    .from("campaign_spots")
    .select(
      "code, side, size_label, width_in, height_in, status, category, price_cents, sold_price_cents, paid_status, paid_cents, payment_method, creative_status, contacts(business_name, contact_name, phone, email, website)",
    )
    .eq("campaign_id", id)
    .order("sort_order")
    .returns<ExportSpot[]>();
  if (error) return new Response(error.message, { status: 500 });

  const dollars = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2));
  const csv = toCsv(
    [
      "Spot", "Side", "Size", "Width (in)", "Height (in)", "Status", "Category",
      "Business", "Contact", "Phone", "Email", "Website",
      "List price", "Sold price", "Paid status", "Paid", "Payment method", "Creative",
    ],
    (spots ?? []).map((s) => [
      s.code, s.side, s.size_label, s.width_in, s.height_in, s.status, s.category,
      s.contacts?.business_name, s.contacts?.contact_name, s.contacts?.phone,
      s.contacts?.email, s.contacts?.website,
      dollars(s.price_cents), dollars(s.sold_price_cents), s.paid_status,
      dollars(s.paid_cents), s.payment_method, s.creative_status,
    ]),
  );

  const filename = `${campaign.name.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-")}-spots.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
