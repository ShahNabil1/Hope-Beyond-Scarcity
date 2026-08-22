import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PlaceholderSection } from "@/components/page-hero";

const title = "Contact | Hope Beyond Scarcity";
const description =
  "Reach the Hope Beyond Scarcity team in Toronto, Ontario for partnerships, media, or donor support.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Say Hello"
        title="We would love to hear from you"
        description="Head office: Toronto, Ontario, Canada. We reply to every message within two business days."
      />
      <PlaceholderSection note="Contact form, map, and department contacts will live here." />
    </>
  );
}
