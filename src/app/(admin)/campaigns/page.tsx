import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { listCampaigns } from "@/lib/queries";
import { CampaignStatusBadge, formatDate } from "@/components/campaign-bits";
import { ButtonLink, Card, PageHeader, PageSkeleton, cn, surfaceClass } from "@/components/ui";

export const metadata: Metadata = { title: "Campaigns" };

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campaigns"
        actions={<ButtonLink href="/campaigns/new">New campaign</ButtonLink>}
      />
      <Suspense fallback={<PageSkeleton />}>
        <CampaignTable />
      </Suspense>
    </>
  );
}

async function CampaignTable() {
  const { supabase } = await requireAdmin();
  const campaigns = await listCampaigns(supabase);

  if (campaigns.length === 0) {
    return (
      <Card>
        <p className="text-sm text-stone-500">No campaigns yet.</p>
      </Card>
    );
  }

  return (
    <div className={cn(surfaceClass, "overflow-x-auto")}>
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-stone-200 text-left text-[11px] font-medium uppercase tracking-wider text-stone-400">
          <tr>
            <th className="px-5 py-3 font-medium">Campaign</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Drop date</th>
            <th className="px-5 py-3 text-right font-medium">Sold</th>
            <th className="px-5 py-3 text-right font-medium">Revenue</th>
            <th className="px-5 py-3 text-right font-medium">Profit</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {campaigns.map((c) => {
            const sellable = c.fin.spots_total - c.fin.spots_house;
            return (
              <tr key={c.id} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                <td className="px-5 py-3.5">
                  <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {c.format_name}
                    {c.area ? ` · ${c.area}` : ""}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <CampaignStatusBadge status={c.status} />
                </td>
                <td className="px-5 py-3.5">{formatDate(c.drop_date)}</td>
                <td className="px-5 py-3.5 text-right">
                  {c.fin.spots_sold}/{sellable}
                </td>
                <td className="px-5 py-3.5 text-right">{formatCents(c.fin.revenue_cents)}</td>
                <td
                  className={cn(
                    "px-5 py-3.5 text-right font-medium",
                    c.fin.profit_cents >= 0 ? "text-green-700" : "text-red-600",
                  )}
                >
                  {formatCents(c.fin.profit_cents)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
