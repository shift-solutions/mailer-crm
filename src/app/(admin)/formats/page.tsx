import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { ButtonLink, Card, PageHeader, PageSkeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Card formats" };

export default function FormatsPage() {
  return (
    <>
      <PageHeader
        title="Card formats"
        subtitle="Reusable layouts. New campaigns copy their format's spots."
        actions={<ButtonLink href="/formats/new">New format</ButtonLink>}
      />
      <Suspense fallback={<PageSkeleton />}>
        <FormatList />
      </Suspense>
    </>
  );
}

async function FormatList() {
  const { supabase } = await requireAdmin();
  const { data: formats, error } = await supabase
    .from("card_formats")
    .select("id, name, width_in, height_in, homes_default, format_spots(default_price_cents, default_status)")
    .order("name");
  if (error) throw error;

  if (!formats?.length) {
    return (
      <Card>
        <p className="text-sm text-stone-500">
          No formats yet. Run the database migrations to seed the 9×12 and 6.25×11 formats, or
          create one.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {formats.map((f) => {
        const sellable = f.format_spots.filter((s) => s.default_status !== "house");
        const fullCard = sellable.reduce((sum, s) => sum + s.default_price_cents, 0);
        return (
          <Link
            key={f.id}
            href={`/formats/${f.id}`}
            className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400"
          >
            <p className="font-medium">{f.name}</p>
            <p className="mt-1 text-sm text-stone-500 tabular">
              {f.width_in}&Prime; × {f.height_in}&Prime; · {sellable.length} spots
              {f.format_spots.length > sellable.length
                ? ` + ${f.format_spots.length - sellable.length} house`
                : ""}
              {f.homes_default ? ` · ${f.homes_default.toLocaleString()} homes` : ""}
            </p>
            <p className="mt-2 text-sm tabular">
              Sold-out revenue at list price: <strong>{formatCents(fullCard)}</strong>
            </p>
          </Link>
        );
      })}
    </div>
  );
}
