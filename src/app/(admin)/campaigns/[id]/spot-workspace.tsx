"use client";

import { useMemo, useState } from "react";
import { formatCents } from "@/lib/money";
import {
  CREATIVE_LABELS,
  type ContactOption,
  type SpotWithContact,
} from "@/lib/types";
import { CardSide, SpotLegend, spotStatusClass } from "@/components/card-side";
import { Badge, Card, cn } from "@/components/ui";
import { SpotDrawer } from "./spot-drawer";

type SortKey = "code" | "status" | "business" | "price" | "paid" | "creative";

export function SpotWorkspace({
  campaignId,
  widthIn,
  heightIn,
  spots,
  contacts,
}: {
  campaignId: string;
  widthIn: number;
  heightIn: number;
  spots: SpotWithContact[];
  contacts: ContactOption[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "code", dir: 1 });
  const selected = spots.find((s) => s.id === selectedId) ?? null;

  const sorted = useMemo(() => {
    const val = (s: SpotWithContact): string | number => {
      switch (sort.key) {
        case "code":
          return s.sort_order;
        case "status":
          return s.status;
        case "business":
          return s.contacts?.business_name?.toLowerCase() ?? "￿";
        case "price":
          return s.sold_price_cents ?? s.price_cents;
        case "paid":
          return s.paid_status;
        case "creative":
          return s.creative_status;
      }
    };
    return [...spots].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [spots, sort]);

  const renderSpot = (s: SpotWithContact) => (
    <button
      type="button"
      onClick={() => setSelectedId(s.id)}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-sm border p-1 text-left text-[9px] leading-tight transition hover:ring-2 hover:ring-stone-900 sm:p-1.5 sm:text-xs",
        spotStatusClass[s.status],
        selectedId === s.id && "ring-2 ring-stone-900",
      )}
      aria-label={`Spot ${s.code}, ${s.status}${s.contacts ? `, ${s.contacts.business_name}` : ""}`}
    >
      <span className="flex justify-between gap-1">
        <span className="font-semibold">{s.code}</span>
        <span className="hidden text-stone-500 tabular sm:inline">
          {s.status === "house" ? "" : formatCents(s.sold_price_cents ?? s.price_cents)}
        </span>
      </span>
      {s.category ? <span className="truncate text-stone-600">{s.category}</span> : null}
      {s.contacts ? (
        <span className="mt-auto truncate font-medium">{s.contacts.business_name}</span>
      ) : (
        <span className="mt-auto truncate capitalize text-stone-400">{s.status}</span>
      )}
    </button>
  );

  const th = (key: SortKey, label: string, right = false) => (
    <th className={cn("px-3 py-2 font-medium", right && "text-right")}>
      <button
        type="button"
        className="hover:text-stone-900"
        onClick={() =>
          setSort((cur) => ({ key, dir: cur.key === key ? ((cur.dir * -1) as 1 | -1) : 1 }))
        }
      >
        {label}
        {sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <>
      <Card title="Spot board" action={<SpotLegend />}>
        <div className="grid gap-6 lg:grid-cols-2">
          {(["front", "back"] as const).map((side) => (
            <CardSide
              key={side}
              title={side === "front" ? "Front" : "Back"}
              widthIn={widthIn}
              heightIn={heightIn}
              spots={spots.filter((s) => s.side === side)}
              renderSpot={renderSpot}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-500">Click a spot to assign a business, set the price, or record payment.</p>
      </Card>

      <Card title="Spots">
        <div className="-m-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-stone-200 text-left text-[11px] font-medium uppercase tracking-wider text-stone-400">
              <tr>
                {th("code", "Spot")}
                <th className="px-3 py-2 font-medium">Size</th>
                {th("status", "Status")}
                {th("business", "Business")}
                <th className="px-3 py-2 font-medium">Category</th>
                {th("price", "Price", true)}
                {th("paid", "Paid")}
                {th("creative", "Creative")}
              </tr>
            </thead>
            <tbody className="tabular">
              {sorted.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "cursor-pointer border-t border-stone-100 hover:bg-stone-50",
                    selectedId === s.id && "bg-stone-100",
                  )}
                >
                  <td className="px-3 py-2">
                    <span className="font-medium">{s.code}</span>{" "}
                    <span className="text-xs capitalize text-stone-500">{s.side}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-stone-600">
                    {s.size_label} · {s.width_in}&Prime;×{s.height_in}&Prime;
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-block rounded border px-1.5 py-0.5 text-xs capitalize", spotStatusClass[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{s.contacts?.business_name ?? <span className="text-stone-400">—</span>}</td>
                  <td className="px-3 py-2 text-stone-600">{s.category ?? ""}</td>
                  <td className="px-3 py-2 text-right">
                    {s.status === "house" ? (
                      <span className="text-stone-400">—</span>
                    ) : s.sold_price_cents != null && s.sold_price_cents !== s.price_cents ? (
                      <>
                        <span className="mr-1 text-xs text-stone-400 line-through">{formatCents(s.price_cents)}</span>
                        {formatCents(s.sold_price_cents)}
                      </>
                    ) : (
                      formatCents(s.sold_price_cents ?? s.price_cents)
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {s.status === "sold" || s.paid_cents > 0 ? <PaidBadge spot={s} /> : null}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {s.status === "sold" || s.status === "held" ? CREATIVE_LABELS[s.creative_status] : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected ? (
        <SpotDrawer
          key={`${selected.id}-${selected.status}-${selected.contact_id}-${selected.paid_cents}-${selected.price_cents}`}
          campaignId={campaignId}
          spot={selected}
          contacts={contacts}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </>
  );
}

function PaidBadge({ spot }: { spot: SpotWithContact }) {
  switch (spot.paid_status) {
    case "paid":
      return <Badge tone="green">Paid</Badge>;
    case "partial":
      return <Badge tone="amber">{formatCents(spot.paid_cents)} paid</Badge>;
    case "refunded":
      return <Badge>Refunded</Badge>;
    default:
      return <Badge tone="red">Unpaid</Badge>;
  }
}
