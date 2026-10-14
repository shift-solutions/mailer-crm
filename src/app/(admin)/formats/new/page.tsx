import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { createFormat } from "../actions";
import { FormatForm } from "../format-form";

export const metadata: Metadata = { title: "New format" };

export default function NewFormatPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow={{ href: "/formats", label: "Card formats" }}
        title="New card format"
        subtitle="Add spots after you create it."
      />
      <Card>
        <FormatForm action={createFormat} submitLabel="Create format" />
      </Card>
    </div>
  );
}
