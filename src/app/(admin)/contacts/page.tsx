import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { PIPELINE_LABELS, PIPELINE_STAGES, type Contact, type PipelineStage } from "@/lib/types";
import { StageBadge } from "@/components/stage-badge";
import { ButtonLink, Card, Input, PageHeader, PageSkeleton, cn, surfaceClass } from "@/components/ui";

export const metadata: Metadata = { title: "Businesses" };

export default function ContactsPage({ searchParams }: PageProps<"/contacts">) {
  return (
    <>
      <PageHeader
        title="Businesses"
        subtitle="Advertisers and prospects"
        actions={<ButtonLink href="/contacts/new">New business</ButtonLink>}
      />
      <Suspense fallback={<PageSkeleton />}>
        <ContactList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

type ListRow = Pick<
  Contact,
  "id" | "business_name" | "contact_name" | "phone" | "email" | "category" | "pipeline_stage" | "tags"
>;

async function ContactList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const stageParam = typeof sp.stage === "string" ? sp.stage : "";
  const stage = (PIPELINE_STAGES as string[]).includes(stageParam)
    ? (stageParam as PipelineStage)
    : null;

  const { supabase } = await requireAdmin();

  let query = supabase
    .from("contacts")
    .select("id, business_name, contact_name, phone, email, category, pipeline_stage, tags")
    .order("business_name");
  if (stage) query = query.eq("pipeline_stage", stage);
  if (q) {
    // Strip characters that have meaning in PostgREST filter syntax.
    const term = q.replace(/[,()*%\\]/g, " ").trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        ["business_name", "contact_name", "phone", "email", "category"]
          .map((c) => `${c}.ilike.${like}`)
          .join(","),
      );
    }
  }

  const [{ data: contacts, error }, { data: stageRows }, { data: sales }] = await Promise.all([
    query.returns<ListRow[]>(),
    supabase.from("contacts").select("pipeline_stage").returns<{ pipeline_stage: PipelineStage }[]>(),
    supabase
      .from("campaign_spots")
      .select("contact_id, sold_price_cents")
      .eq("status", "sold")
      .not("contact_id", "is", null)
      .returns<{ contact_id: string; sold_price_cents: number | null }[]>(),
  ]);
  if (error) throw error;

  const stageCounts = new Map<string, number>();
  for (const r of stageRows ?? []) {
    stageCounts.set(r.pipeline_stage, (stageCounts.get(r.pipeline_stage) ?? 0) + 1);
  }
  const totalCount = stageRows?.length ?? 0;

  const lifetime = new Map<string, { spots: number; cents: number }>();
  for (const s of sales ?? []) {
    const cur = lifetime.get(s.contact_id) ?? { spots: 0, cents: 0 };
    cur.spots += 1;
    cur.cents += s.sold_price_cents ?? 0;
    lifetime.set(s.contact_id, cur);
  }

  const href = (nextStage: string | null) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (nextStage) p.set("stage", nextStage);
    const s = p.toString();
    return s ? `/contacts?${s}` : "/contacts";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form action="/contacts" className="flex gap-2">
          {stage ? <input type="hidden" name="stage" value={stage} /> : null}
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, email, category"
            className="w-72"
            aria-label="Search businesses"
          />
        </form>
        <nav className="flex flex-wrap gap-1 text-sm" aria-label="Filter by stage">
          {[{ key: null, label: "All", count: totalCount }, ...PIPELINE_STAGES.map((s) => ({
            key: s,
            label: PIPELINE_LABELS[s],
            count: stageCounts.get(s) ?? 0,
          }))].map((t) => (
            <Link
              key={t.label}
              href={href(t.key)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                stage === t.key ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100",
              )}
            >
              {t.label} <span className="tabular opacity-70">{t.count}</span>
            </Link>
          ))}
        </nav>
      </div>

      {!contacts?.length ? (
        <Card>
          <p className="text-sm text-stone-500">
            {q || stage
              ? "No businesses match."
              : "No businesses yet. Add one here, or sell a spot to a new business from a campaign."}
          </p>
        </Card>
      ) : (
        <div className={cn(surfaceClass, "overflow-x-auto")}>
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-stone-200 text-left text-[11px] font-medium uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Tags</th>
                <th className="px-5 py-3 text-right font-medium">Spots</th>
                <th className="px-5 py-3 text-right font-medium">Lifetime</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {contacts.map((c) => {
                const lt = lifetime.get(c.id);
                return (
                  <tr key={c.id} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                        {c.business_name}
                      </Link>
                      {c.category ? <p className="text-xs text-stone-500">{c.category}</p> : null}
                    </td>
                    <td className="px-5 py-3.5">
                      <StageBadge stage={c.pipeline_stage} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-stone-600">
                      {c.contact_name ? <p className="text-sm text-stone-800">{c.contact_name}</p> : null}
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="hover:underline">
                          {c.phone}
                        </a>
                      ) : null}
                      {c.phone && c.email ? " · " : null}
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="hover:underline">
                          {c.email}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <span key={t} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">{lt?.spots ?? 0}</td>
                    <td className="px-5 py-3.5 text-right">{lt ? formatCents(lt.cents) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
