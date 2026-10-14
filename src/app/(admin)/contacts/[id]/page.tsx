import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { CREATIVE_LABELS, SOURCE_LABELS, type CampaignSpot, type Contact } from "@/lib/types";
import { formatDate } from "@/components/campaign-bits";
import { spotStatusClass } from "@/components/card-side";
import { Badge, Card, Metric, PageHeader, PageSkeleton, cn } from "@/components/ui";
import { EditPanel } from "@/components/drawer";
import { updateContact } from "../actions";
import { ContactForm } from "../contact-form";
import { DeleteContactButton, StagePicker } from "./contact-controls";

type SpotRow = Pick<
  CampaignSpot,
  | "id"
  | "code"
  | "status"
  | "category"
  | "price_cents"
  | "sold_price_cents"
  | "paid_status"
  | "paid_cents"
  | "creative_status"
> & {
  campaigns: { id: string; name: string; drop_date: string | null } | null;
};

export default function ContactDetailPage({ params }: PageProps<"/contacts/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ContactDetail params={params} />
    </Suspense>
  );
}

async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: contact }, { data: spots }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).maybeSingle<Contact>(),
    supabase
      .from("campaign_spots")
      .select(
        "id, code, status, category, price_cents, sold_price_cents, paid_status, paid_cents, creative_status, campaigns(id, name, drop_date)",
      )
      .eq("contact_id", id)
      .returns<SpotRow[]>(),
  ]);
  if (!contact) notFound();

  const rows = (spots ?? []).sort((a, b) =>
    (b.campaigns?.drop_date ?? "").localeCompare(a.campaigns?.drop_date ?? ""),
  );
  const sold = rows.filter((s) => s.status === "sold");
  const lifetimeCents = sold.reduce((n, s) => n + (s.sold_price_cents ?? 0), 0);
  const paidCents = rows.reduce((n, s) => n + s.paid_cents, 0);
  const owedCents = sold.reduce(
    (n, s) => n + (s.paid_status === "refunded" ? 0 : Math.max((s.sold_price_cents ?? 0) - s.paid_cents, 0)),
    0,
  );

  const links: [string, string | null, string | null][] = [
    ["Phone", contact.phone, contact.phone ? `tel:${contact.phone}` : null],
    ["Email", contact.email, contact.email ? `mailto:${contact.email}` : null],
    ["Website", contact.website?.replace(/^https?:\/\//, "") ?? null, contact.website],
    ["Facebook", contact.facebook_url ? "Page" : null, contact.facebook_url],
    ["Address", contact.address, null],
  ];
  const filled = links.filter(([, text]) => text);

  return (
    <>
      <PageHeader
        eyebrow={{ href: "/contacts", label: "Businesses" }}
        title={contact.business_name}
        subtitle={
          [
            contact.category,
            contact.contact_name,
            contact.source ? `via ${SOURCE_LABELS[contact.source]}` : null,
            `added ${new Date(contact.created_at).toLocaleDateString()}`,
          ]
            .filter(Boolean)
            .join(" · ")
        }
        actions={
          <>
            <StagePicker key={contact.pipeline_stage} contactId={contact.id} stage={contact.pipeline_stage} />
            <EditPanel title="Edit business" description={contact.business_name}>
              <ContactForm
                action={updateContact.bind(null, contact.id)}
                contact={contact}
                submitLabel="Save business"
              />
            </EditPanel>
            <DeleteContactButton contactId={contact.id} />
          </>
        }
      />

      <div className="space-y-6">
        <section className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            {filled.length ? (
              <dl className="divide-y divide-stone-100 text-sm">
                {filled.map(([label, text, href]) => (
                  <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-3 py-2.5 first:pt-0 last:pb-0">
                    <dt className="text-xs font-medium text-stone-500">{label}</dt>
                    <dd className={cn("min-w-0", href ? "truncate" : "")}>
                      {text && href ? (
                        <a
                          href={href}
                          className="text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-stone-900"
                          {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                        >
                          {text}
                        </a>
                      ) : (
                        text
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-stone-500">No contact details yet.</p>
            )}
            {contact.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-1">
                {contact.tags.map((t) => (
                  <span key={t} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            {contact.notes ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">{contact.notes}</p>
            ) : null}
          </Card>
          <Card>
            <dl className="space-y-4">
              <Metric label="Spots bought" value={sold.length} />
              <Metric label="Lifetime" value={formatCents(lifetimeCents)} />
              <Metric label="Owed" value={formatCents(owedCents)} tone={owedCents > 0 ? "bad" : undefined} />
            </dl>
            <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-500 tabular">
              {formatCents(paidCents)} collected
            </p>
          </Card>
        </section>

        <Card title="Spots">
          {rows.length === 0 ? (
            <p className="text-sm text-stone-500">
              No spots yet. Assign this business from a campaign&apos;s spot board.
            </p>
          ) : (
            <div className="-m-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-stone-200 text-left text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Campaign</th>
                    <th className="px-5 py-3 font-medium">Spot</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Price</th>
                    <th className="px-5 py-3 font-medium">Paid</th>
                    <th className="px-5 py-3 font-medium">Creative</th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                      <td className="px-5 py-3">
                        {s.campaigns ? (
                          <Link href={`/campaigns/${s.campaigns.id}`} className="font-medium hover:underline">
                            {s.campaigns.name}
                          </Link>
                        ) : null}
                        <p className="text-xs text-stone-500">Drops {formatDate(s.campaigns?.drop_date ?? null)}</p>
                      </td>
                      <td className="px-5 py-3">
                        {s.code}
                        {s.category ? <span className="text-xs text-stone-500"> · {s.category}</span> : null}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-block rounded border px-1.5 py-0.5 text-xs capitalize", spotStatusClass[s.status])}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">{formatCents(s.sold_price_cents ?? s.price_cents)}</td>
                      <td className="px-5 py-3">
                        {s.paid_status === "paid" ? (
                          <Badge tone="green">Paid</Badge>
                        ) : s.paid_status === "partial" ? (
                          <Badge tone="amber">{formatCents(s.paid_cents)} paid</Badge>
                        ) : s.paid_status === "refunded" ? (
                          <Badge>Refunded</Badge>
                        ) : s.status === "sold" ? (
                          <Badge tone="red">Unpaid</Badge>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-xs">{CREATIVE_LABELS[s.creative_status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
