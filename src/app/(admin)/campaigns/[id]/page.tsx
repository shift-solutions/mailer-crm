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
import { ButtonLink, Card, Metric, PageHeader, PageSkeleton } from "@/components/ui";
import { EditPanel } from "@/components/drawer";
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
        eyebrow={{ href: "/campaigns", label: "Campaigns" }}
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
            <EditPanel title="Edit campaign" description={campaign.name}>
              <CampaignForm
                action={updateCampaign.bind(null, campaign.id)}
                campaign={campaign}
                submitLabel="Save campaign"
              />
            </EditPanel>
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
            <dl className="mb-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Metric label="Revenue (sold)" value={formatCents(fin.revenueCents)} />
              <Metric label="Collected" value={formatCents(fin.collectedCents)} />
              <Metric label="Cost" value={formatCents(fin.costCents)} />
              <Metric
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
            <dl className="grid grid-cols-4 gap-2 text-center">
              <Metric size="md" label="Sold" value={`${fin.sold}/${sellable}`} />
              <Metric size="md" label="Held" value={fin.held} />
              <Metric size="md" label="Open" value={fin.open} />
              <Metric size="md" label="House" value={fin.house} />
            </dl>
          </Card>
        </section>

        {/* Timeline */}
        <Card title="Timeline">
          <ol className="grid gap-3 sm:grid-cols-4">
            {timeline.map(([label, date]) => (
              <li key={label} className="rounded-xl border border-stone-100 bg-stone-50 px-3.5 py-3">
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

        {campaign.notes ? (
          <Card title="Notes">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{campaign.notes}</p>
          </Card>
        ) : null}
      </div>
    </>
  );
}
