"use client";

import { useTransition } from "react";
import { PIPELINE_LABELS, PIPELINE_STAGES, type PipelineStage } from "@/lib/types";
import { Button, Select } from "@/components/ui";
import { deleteContact, setPipelineStage } from "../actions";

export function StagePicker({ contactId, stage }: { contactId: string; stage: PipelineStage }) {
  const [pending, start] = useTransition();
  return (
    <Select
      aria-label="Pipeline stage"
      defaultValue={stage}
      disabled={pending}
      className="w-36"
      onChange={(e) => {
        const next = e.target.value;
        start(() => setPipelineStage(contactId, next));
      }}
    >
      {PIPELINE_STAGES.map((s) => (
        <option key={s} value={s}>
          {PIPELINE_LABELS[s]}
        </option>
      ))}
    </Select>
  );
}

export function DeleteContactButton({ contactId }: { contactId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this business? This can't be undone.")) return;
        start(async () => {
          const res = await deleteContact(contactId);
          if (res?.message) alert(res.message);
        });
      }}
    >
      Delete
    </Button>
  );
}
