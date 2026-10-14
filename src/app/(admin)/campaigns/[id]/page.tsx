import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { computeFinancials, goNoGo } from "@/lib/financials";
import { formatCents } from "@/lib/money";
import type { Campaign, CardFormat, ContactOption, SpotWithContact } from "@/lib/types";
import { BreakevenBar } from "@/components/breakeven-bar";
import {
  CampaignStatusBadge,
  DaysLabel,
  GoNoGoBadge,
  formatDate,
} from "@/components/campaign-bits";
import { ButtonLink, Card, PageHeader, PageSkeleton, cn } from "@/components/ui";
import { updateCampaign } from "../actions";
import { CampaignForm } from "../campaign-form";
import { DeleteCampaignButton } from "./delete-campaign";
import { SpotWorkspace } from "./spot-workspace";

export default function CampaignDetailPage({ params }: PageProps<"/campaigns/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CampaignDetail params={params} />
    </Suspense>
  );
}

async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle<Campaign>();
  if (!campaign) notFound();

  const [{ data: format }, { data: spots, error: spotsError }, { data: contacts }] =
    await Promise.all([
      supabase
        .from("card_formats")
        .select("*")
        .eq("id", campaign.format_id)
        .single<CardFormat>(),
      supabase
        .from("campaign_spots")
        .select("*, contacts(id, business_name)")
        .eq("campaign_id", id)
        .order("sort_order")
        .returns<SpotWithContact[]>(),
      supabase
        .from("contacts")
        .select("id, business_name")
        .order("business_name")
        .returns<ContactOption[]>(),
    ]);
  if (spotsError) throw spotsError;

  const allSpots = spots ?? [];
  const fin = computeFinancials(campaign, allSpots);
  const sellable = fin.total - fin.house;
  const gng = goNoGo(fin.sold, campaign.min_spots_to_go, campaign.sales_deadline);

  const timeline: [string, string | null][] = [
    ["Sales open", campaign.sales_open_date],
    ["Sales deadline", campaign.sales_deadline],
    ["Artwork deadline", campaign.artwork_deadline],
    ["Drop date", campaign.drop_date],
  ];

  return (
    <>
      <PageHeader
        title={campaign.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <CampaignStatusBadge status={campaign.status} />
            <span>
              {[
                format?.name,
                campaign.area,
                campaign.homes ? `${campaign.homes.toLocaleString()} homes` : null,
                campaign.routes ? `Routes ${campaign.routes}` : null,
                campaign.run_months > 1 ? `${campaign.run_months}-month run` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
        }
        actions={
          <>
            <ButtonLink
              href={`/campaigns/${campaign.id}/export`}
              variant="secondary"
              prefetch={false}
            >
              Export CSV
            </ButtonLink>
            <DeleteCampaignButton campaignId={campaign.id} />
          </>
        }
      />

      <div className="space-y-6">
        {/* Financials */}
        <section className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <dl className="mb-4 grid grid-cols-2 gap-4 text-sm tabular sm:grid-cols-4">
              <Stat label="Revenue (sold)" value={formatCents(fin.revenueCents)} />
              <Stat label="Collected" value={formatCents(fin.collectedCents)} />
              <Stat label="Cost" value={formatCents(fin.costCents)} />
              <Stat
                label="Profit"
                value={formatCents(fin.profitCents)}
                tone={fin.profitCents >= 0 ? "good" : "bad"}
              />
            </dl>
            <BreakevenBar revenueCents={fin.revenueCents} costCents={fin.costCents} />
            <p className="mt-3 text-xs text-stone-500 tabular">
              Costs: postage {formatCents(campaign.postage_cost_cents)} · print{" "}
              {formatCents(campaign.print_cost_cents)} · other{" "}
              {formatCents(campaign.other_cost_cents)}
            </p>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Spots</p>
              <GoNoGoBadge state={gng} sold={fin.sold} min={campaign.min_spots_to_go} />
            </div>
            <dl className="grid grid-cols-4 gap-2 text-center text-sm tabular">
              <Stat label="Sold" value={`${fin.sold}/${sellable}`} />
              <Stat label="Held" value={fin.held} />
              <Stat label="Open" value={fin.open} />
              <Stat label="House" value={fin.house} />
            </dl>
          </Card>
        </section>

        {/* Timeline */}
        <Card title="Timeline">
          <ol className="grid gap-3 sm:grid-cols-4">
            {timeline.map(([label, date]) => (
              <li key={label} className="rounded-md border border-stone-100 bg-stone-50 px-3 py-2">
                <p className="text-xs text-stone-500">{label}</p>
                <p className="text-sm font-medium tabular">{formatDate(date)}</p>
                <p className="text-xs tabular">
                  <DaysLabel date={date} />
                </p>
              </li>
            ))}
          </ol>
        </Card>

        {/* Spot board, table, and drawer */}
        {format ? (
          <SpotWorkspace
            campaignId={campaign.id}
            widthIn={format.width_in}
            heightIn={format.height_in}
            spots={allSpots}
            contacts={contacts ?? []}
          />
        ) : null}

        <Card title="Campaign details">
          <CampaignForm
            action={updateCampaign.bind(null, campaign.id)}
            campaign={campaign}
            submitLabel="Save campaign"
          />
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "good" | "bad";
}) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd
        className={cn(
          "text-lg font-semibold",
          tone === "good" && "text-green-700",
          tone === "bad" && "text-red-600",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
