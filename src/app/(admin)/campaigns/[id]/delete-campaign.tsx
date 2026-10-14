"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { deleteCampaign } from "../actions";

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this campaign and all of its spots? This can't be undone.")) return;
        start(async () => {
          const res = await deleteCampaign(campaignId);
          if (res?.message) alert(res.message);
        });
      }}
    >
      Delete
    </Button>
  );
}
