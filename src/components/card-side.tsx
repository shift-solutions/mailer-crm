import type { ReactNode } from "react";
import { cn } from "@/components/ui";

export type BoardSpot = {
  id: string;
  code: string;
  width_in: number;
  height_in: number;
  x_in: number | null;
  y_in: number | null;
};

/**
 * Draws one side of a card to scale. Spots with x/y positions are placed
 * where they print; any spot without a position falls into a row below.
 * `renderSpot` returns the inside of each spot (status color, labels, button).
 */
export function CardSide<T extends BoardSpot>({
  title,
  widthIn,
  heightIn,
  spots,
  renderSpot,
}: {
  title: string;
  widthIn: number;
  heightIn: number;
  spots: T[];
  renderSpot: (spot: T) => ReactNode;
}) {
  const placed = spots.filter((s) => s.x_in != null && s.y_in != null);
  const unplaced = spots.filter((s) => s.x_in == null || s.y_in == null);

  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 flex justify-between text-xs font-medium text-stone-500">
        <span>{title}</span>
        <span className="tabular">
          {widthIn}&Prime; × {heightIn}&Prime;
        </span>
      </figcaption>
      <div
        className="relative w-full rounded-xl border border-stone-300 bg-stone-100 shadow-sm"
        style={{ aspectRatio: `${widthIn} / ${heightIn}` }}
      >
        {placed.map((s) => (
          <div
            key={s.id}
            className="absolute p-[0.3%]"
            style={{
              left: `${((s.x_in ?? 0) / widthIn) * 100}%`,
              top: `${((s.y_in ?? 0) / heightIn) * 100}%`,
              width: `${(s.width_in / widthIn) * 100}%`,
              height: `${(s.height_in / heightIn) * 100}%`,
            }}
          >
            {renderSpot(s)}
          </div>
        ))}
        {placed.length === 0 && unplaced.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-stone-400">
            No spots on this side
          </p>
        ) : null}
      </div>
      {unplaced.length > 0 ? (
        <div className="mt-2">
          <p className="mb-1 text-xs text-stone-500">No position set</p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {unplaced.map((s) => (
              <div key={s.id} className="h-16">
                {renderSpot(s)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </figure>
  );
}

export const spotStatusClass: Record<string, string> = {
  open: "bg-spot-open border-stone-300 border-dashed",
  held: "bg-spot-held border-amber-400",
  sold: "bg-spot-sold border-green-500",
  house: "bg-spot-house border-stone-400",
};

export function SpotLegend() {
  const items = [
    ["open", "Open"],
    ["held", "Held"],
    ["sold", "Sold"],
    ["house", "House"],
  ] as const;
  return (
    <ul className="flex flex-wrap gap-3 text-xs text-stone-600">
      {items.map(([k, label]) => (
        <li key={k} className="flex items-center gap-1.5">
          <span className={cn("inline-block size-3 rounded-sm border", spotStatusClass[k])} />
          {label}
        </li>
      ))}
    </ul>
  );
}
