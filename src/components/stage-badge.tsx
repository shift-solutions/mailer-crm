import { PIPELINE_LABELS, type PipelineStage } from "@/lib/types";
import { Badge } from "@/components/ui";

const tone: Record<PipelineStage, "neutral" | "green" | "amber" | "red" | "blue"> = {
  lead: "neutral",
  contacted: "blue",
  interested: "amber",
  customer: "green",
  lost: "red",
};

export function StageBadge({ stage }: { stage: PipelineStage }) {
  return <Badge tone={tone[stage]}>{PIPELINE_LABELS[stage]}</Badge>;
}
