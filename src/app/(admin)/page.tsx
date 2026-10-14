import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { listCampaigns } from "@/lib/queries";
import { BreakevenBar } from "@/components/breakeven-bar";
import { CampaignStatusBadge, DaysLabel } from "@/components/campaign-bits";
import { ButtonLink, Card, PageHeader, Skeleton, surfaceClass, cn } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={<ButtonLink href="/campaigns/new">New campaign</ButtonLink>}
      />
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-400">Active campaigns</h2>
      <Suspense
        fallback={
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        }
      >
        <ActiveCampaigns />
      </Suspense>
    </>
  );
}

async function ActiveCampaigns() {
  const { supabase } = await requireAdmin();
  const campaigns = await listCampaigns(supabase, { activeOnly: true });

  if (campaigns.length === 0) {
    return (
      <Card>
        <p className="text-sm text-stone-500">
          No active campaigns. Start one to see spots sold and breakeven here.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((c) => {
        const sellable = c.fin.spots_total - c.fin.spots_house;
        return (
          <Link
            key={c.id}
            href={`/campaigns/${c.id}`}
            className={cn(
              surfaceClass,
              "block p-5 transition duration-200 hover:-translate-y-px hover:border-stone-300 hover:shadow-md",
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-stone-500">{c.area ?? c.format_name}</p>
              </div>
              <CampaignStatusBadge status={c.status} />
            </div>
            <BreakevenBar revenueCents={c.fin.revenue_cents} costCents={c.fin.cost_cents} />
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm tabular">
              <div>
                <dt className="text-xs text-stone-500">Spots sold</dt>
                <dd className="font-medium">
                  {c.fin.spots_sold}/{sellable}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Revenue</dt>
                <dd className="font-medium">{formatCents(c.fin.revenue_cents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Sales deadline</dt>
                <dd>
                  <DaysLabel date={c.sales_deadline} />
                </dd>
              </div>
            </dl>
          </Link>
        );
      })}
    </div>
  );
}
