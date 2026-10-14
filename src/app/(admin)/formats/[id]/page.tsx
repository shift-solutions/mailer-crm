import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import type { CardFormat, FormatSpot } from "@/lib/types";
import { CardSide } from "@/components/card-side";
import { Card, PageHeader, PageSkeleton } from "@/components/ui";
import { EditPanel } from "@/components/drawer";
import { saveFormatSpot, updateFormat } from "../actions";
import { FormatForm } from "../format-form";
import { DeleteFormatButton, FormatSpotRow } from "./spot-editor";

export default function FormatDetailPage({ params }: PageProps<"/formats/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FormatDetail params={params} />
    </Suspense>
  );
}

async function FormatDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: format }, { data: spots }] = await Promise.all([
    supabase.from("card_formats").select("*").eq("id", id).maybeSingle<CardFormat>(),
    supabase
      .from("format_spots")
      .select("*")
      .eq("format_id", id)
      .order("sort_order")
      .returns<FormatSpot[]>(),
  ]);
  if (!format) notFound();
  const allSpots = spots ?? [];
  const listTotal = allSpots
    .filter((s) => s.default_status !== "house")
    .reduce((sum, s) => sum + s.default_price_cents, 0);

  const renderSpot = (s: FormatSpot) => (
    <div
      className={`flex h-full flex-col justify-between rounded-sm border p-1 text-[10px] leading-tight sm:text-xs ${
        s.default_status === "house" ? "border-stone-400 bg-spot-house" : "border-stone-300 bg-white"
      }`}
    >
      <span className="font-semibold">{s.code}</span>
      <span className="truncate text-stone-500">
        {s.default_status === "house" ? "House" : formatCents(s.default_price_cents)}
      </span>
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow={{ href: "/formats", label: "Card formats" }}
        title={format.name}
        subtitle={`${format.width_in}″ × ${format.height_in}″ · ${allSpots.length} spots · ${formatCents(listTotal)} at list${
          format.homes_default ? ` · ${format.homes_default.toLocaleString()} homes` : ""
        }`}
        actions={
          <>
            <EditPanel title="Edit format" description={format.name} width="lg">
              <FormatForm
                action={updateFormat.bind(null, format.id)}
                format={format}
                submitLabel="Save format"
              />
            </EditPanel>
            <DeleteFormatButton formatId={format.id} />
          </>
        }
      />

      <div className="space-y-6">
        <Card title="Layout preview">
          <div className="grid gap-6 lg:grid-cols-2">
            {(["front", "back"] as const).map((side) => (
              <CardSide
                key={side}
                title={side === "front" ? "Front" : "Back"}
                widthIn={format.width_in}
                heightIn={format.height_in}
                spots={allSpots.filter((s) => s.side === side)}
                renderSpot={renderSpot}
              />
            ))}
          </div>
        </Card>

        <Card title="Spots">
          <p className="mb-3 text-xs text-stone-500">
            Position (X, Y) is the spot&apos;s top-left corner in inches from the top-left of that
            side. Changes apply to new campaigns only; existing campaigns keep their own copy.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-left text-xs text-stone-500">
                <tr>
                  {["Code", "Side", "Size label", "W", "H", "Price", "Type", "X", "Y", "Order", ""].map(
                    (h) => (
                      <th key={h} className="px-1 pb-2 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {allSpots.map((s) => (
                  <FormatSpotRow
                    key={`${s.id}-${s.code}-${s.default_price_cents}`}
                    formatId={format.id}
                    spot={s}
                    action={saveFormatSpot.bind(null, format.id, s.id)}
                  />
                ))}
                <FormatSpotRow
                  key={`new-${allSpots.length}`}
                  formatId={format.id}
                  action={saveFormatSpot.bind(null, format.id, null)}
                  nextOrder={(allSpots.at(-1)?.sort_order ?? 0) + 1}
                />
              </tbody>
            </table>
          </div>
        </Card>

        {format.notes ? (
          <Card title="Notes">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{format.notes}</p>
          </Card>
        ) : null}
      </div>
    </>
  );
}
