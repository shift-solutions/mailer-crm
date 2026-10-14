import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { ButtonLink, Card, PageHeader, PageSkeleton } from "@/components/ui";
import { createCampaign } from "../actions";
import { CampaignForm } from "../campaign-form";

export const metadata: Metadata = { title: "New campaign" };

export default function NewCampaignPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow={{ href: "/campaigns", label: "Campaigns" }}
        title="New campaign"
        subtitle="Spots are generated from the card format you pick."
      />
      <Suspense fallback={<PageSkeleton />}>
        <NewCampaign />
      </Suspense>
    </div>
  );
}

async function NewCampaign() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("card_formats")
    .select("id, name, homes_default, format_spots(count)")
    .order("name");
  if (error) throw error;

  const formats = (data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    homes_default: f.homes_default,
    spots: (f.format_spots as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  if (formats.length === 0) {
    return (
      <Card>
        <p className="mb-3 text-sm text-stone-600">Create a card format first.</p>
        <ButtonLink href="/formats/new">New format</ButtonLink>
      </Card>
    );
  }

  return (
    <Card>
      <CampaignForm action={createCampaign} formats={formats} submitLabel="Create campaign" />
    </Card>
  );
}
