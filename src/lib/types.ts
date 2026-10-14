export type SpotSide = "front" | "back";
export type SpotStatus = "open" | "held" | "sold" | "house";
export type PaidStatus = "unpaid" | "partial" | "paid" | "refunded";
export type CreativeStatus = "none" | "assets_in" | "proof_sent" | "approved";
export type CampaignStatus =
  | "planning"
  | "selling"
  | "production"
  | "mailed"
  | "closed";

export type CardFormat = {
  id: string;
  name: string;
  width_in: number;
  height_in: number;
  homes_default: number | null;
  notes: string | null;
};

export type FormatSpot = {
  id: string;
  format_id: string;
  code: string;
  side: SpotSide;
  size_label: string;
  width_in: number;
  height_in: number;
  default_price_cents: number;
  default_status: "open" | "house";
  x_in: number | null;
  y_in: number | null;
  sort_order: number;
};

export type Campaign = {
  id: string;
  name: string;
  format_id: string;
  area: string | null;
  routes: string | null;
  homes: number | null;
  status: CampaignStatus;
  sales_open_date: string | null;
  sales_deadline: string | null;
  artwork_deadline: string | null;
  drop_date: string | null;
  postage_cost_cents: number;
  print_cost_cents: number;
  other_cost_cents: number;
  min_spots_to_go: number | null;
  run_months: number;
  notes: string | null;
};

export type CampaignSpot = {
  id: string;
  campaign_id: string;
  code: string;
  side: SpotSide;
  size_label: string;
  width_in: number;
  height_in: number;
  price_cents: number;
  category: string | null;
  status: SpotStatus;
  contact_id: string | null;
  sold_price_cents: number | null;
  paid_status: PaidStatus;
  paid_cents: number;
  payment_method: string | null;
  stripe_ref: string | null;
  creative_status: CreativeStatus;
  sold_at: string | null;
  x_in: number | null;
  y_in: number | null;
  sort_order: number;
};

export type SpotWithContact = CampaignSpot & {
  contacts: { id: string; business_name: string } | null;
};

export type ContactOption = { id: string; business_name: string };

export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  "planning",
  "selling",
  "production",
  "mailed",
  "closed",
];
export const SPOT_STATUSES: SpotStatus[] = ["open", "held", "sold", "house"];
export const PAID_STATUSES: PaidStatus[] = ["unpaid", "partial", "paid", "refunded"];
export const CREATIVE_STATUSES: CreativeStatus[] = [
  "none",
  "assets_in",
  "proof_sent",
  "approved",
];
export const PAYMENT_METHODS = ["stripe", "check", "cash", "zelle", "other"] as const;

export const CREATIVE_LABELS: Record<CreativeStatus, string> = {
  none: "No assets",
  assets_in: "Assets in",
  proof_sent: "Proof sent",
  approved: "Approved",
};
