import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { createContact } from "../actions";
import { ContactForm } from "../contact-form";

export const metadata: Metadata = { title: "New business" };

export default function NewContactPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader title="New business" />
      <Card>
        <ContactForm action={createContact} submitLabel="Add business" />
      </Card>
    </div>
  );
}
