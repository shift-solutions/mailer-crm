import { describe, expect, it } from "vitest";
import { contactSchema } from "./validation";

const base = { business_name: "Green Acres", pipeline_stage: "lead" };

describe("contactSchema", () => {
  it("normalizes tags and blank fields", () => {
    const c = contactSchema.parse({ ...base, tags: " Westridge, no-website,westridge ", email: "", phone: "" });
    expect(c.tags).toEqual(["westridge", "no-website"]);
    expect(c.email).toBeNull();
    expect(c.phone).toBeNull();
  });
  it("adds https:// to bare websites", () => {
    expect(contactSchema.parse({ ...base, website: "greenacres.com" }).website).toBe("https://greenacres.com");
  });
  it("rejects a bad email and a missing name", () => {
    expect(contactSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...base, business_name: " " }).success).toBe(false);
  });
});
